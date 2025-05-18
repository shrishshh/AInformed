
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenerateNewsFeedInput } from "@/ai/flows/generate-news-feed";
import { Search } from "lucide-react";
import React from "react";

// Simplified schema based on the new UI
const formSchema = z.object({
  searchQuery: z.string().min(1, "Search query is required."),
  // Sort functionality is mocked visually
});

type FormData = z.infer<typeof formSchema>;

interface FeedCustomizationFormProps {
  onSubmit: (data: GenerateNewsFeedInput) => void;
  isLoading: boolean;
  initialValues?: Partial<GenerateNewsFeedInput>; // Keep for potential initial search query
}

export function FeedCustomizationForm({ onSubmit, isLoading, initialValues }: FeedCustomizationFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      searchQuery: initialValues?.keywords?.join(", ") || "",
    },
  });

  const handleSubmit: SubmitHandler<FormData> = (data) => {
    // Adapt the simplified form data to the GenerateNewsFeedInput structure
    const backendInput: GenerateNewsFeedInput = {
      keywords: data.searchQuery.split(',').map(k => k.trim()).filter(k => k.length > 0),
      topics: data.searchQuery.split(',').map(k => k.trim()).filter(k => k.length > 0), // Use search query for topics too, or define default
      reliabilityScore: initialValues?.reliabilityScore || 0.7, // Keep previous or default
      numberOfArticles: initialValues?.numberOfArticles || 5, // Keep previous or default
    };
    onSubmit(backendInput);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      form.handleSubmit(handleSubmit)();
    }
  };

  return (
    <div className="mb-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col sm:flex-row items-center gap-4">
          <FormField
            control={form.control}
            name="searchQuery"
            render={({ field }) => (
              <FormItem className="flex-grow w-full sm:w-auto">
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Search articles..." 
                      {...field} 
                      className="pl-10 h-12 text-base bg-input border-border focus:bg-card"
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Select defaultValue="latest" disabled={isLoading}>
            <SelectTrigger className="w-full sm:w-[180px] h-12 bg-input border-border focus:bg-card text-base">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="relevant">Relevant</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
          {/* Hidden submit button, form submitted on Enter in search input */}
           <Button type="submit" className="hidden" disabled={isLoading}>
            Search
          </Button>
        </form>
      </Form>
    </div>
  );
}
