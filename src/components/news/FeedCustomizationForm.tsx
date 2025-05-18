
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerateNewsFeedInput } from "@/ai/flows/generate-news-feed";
import { useState } from "react";

const formSchema = z.object({
  keywords: z.string().min(1, "Keywords are required.").transform(val => val.split(',').map(k => k.trim()).filter(k => k.length > 0)),
  topics: z.string().min(1, "Topics are required.").transform(val => val.split(',').map(t => t.trim()).filter(t => t.length > 0)),
  reliabilityScore: z.number().min(0).max(1).default(0.7),
  numberOfArticles: z.number().min(1).max(10).default(5),
});

type FormData = z.infer<typeof formSchema>;

interface FeedCustomizationFormProps {
  onSubmit: (data: GenerateNewsFeedInput) => void;
  isLoading: boolean;
  initialValues?: Partial<GenerateNewsFeedInput>;
}

export function FeedCustomizationForm({ onSubmit, isLoading, initialValues }: FeedCustomizationFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: initialValues?.keywords?.join(', ') || "technology, AI",
      topics: initialValues?.topics?.join(', ') || "latest advancements, ethical AI",
      reliabilityScore: initialValues?.reliabilityScore || 0.7,
      numberOfArticles: initialValues?.numberOfArticles || 5,
    },
  });

  const [reliabilityValue, setReliabilityValue] = useState<number>(initialValues?.reliabilityScore || 0.7);

  const handleSubmit: SubmitHandler<FormData> = (data) => {
    onSubmit(data as GenerateNewsFeedInput);
  };

  return (
    <Card className="mb-8 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Customize Your News Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AI, space exploration, climate change" {...field} />
                  </FormControl>
                  <FormDescription>Enter keywords to find relevant articles.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topics (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., innovation, global politics, health breakthroughs" {...field} />
                  </FormControl>
                  <FormDescription>Specify topics you are interested in.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reliabilityScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Reliability Score: {reliabilityValue.toFixed(2)}</FormLabel>
                  <FormControl>
                     <Slider
                        defaultValue={[field.value]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={(value) => {
                          field.onChange(value[0]);
                          setReliabilityValue(value[0]);
                        }}
                        disabled={isLoading}
                      />
                  </FormControl>
                  <FormDescription>Set the minimum trustworthiness of news sources.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numberOfArticles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Articles (1-10)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="10" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Generating Feed..." : "Generate Feed"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
