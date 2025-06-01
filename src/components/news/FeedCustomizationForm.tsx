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

// Form schema based on what the user interacts with
const formSchema = z.object({
  searchQuery: z.string().min(1, "Search query is required."),
  // numberOfArticles is managed by initialValues from page.tsx now
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
      searchQuery: initialValues?.searchQuery || "",
    },
  });

  React.useEffect(() => {
    if (initialValues?.searchQuery) {
      form.reset({ searchQuery: initialValues.searchQuery });
    }
  }, [initialValues?.searchQuery, form]);

  const handleSubmit: SubmitHandler<FormData> = (data) => {
    const backendInput: GenerateNewsFeedInput = {
      searchQuery: data.searchQuery,
      numberOfArticles: initialValues?.numberOfArticles || 15, 
    };
    onSubmit(backendInput);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      form.handleSubmit(handleSubmit)();
    }
  };

  return (
    <div className="mb-8 bg-background/80 backdrop-blur-md py-4 px-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <FormField
            control={form.control}
            name="searchQuery"
            render={({ field }) => (
              <FormItem className="flex-grow w-full sm:w-auto">
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Search live news (e.g., 'AI in healthcare', 'SpaceX launch')..." 
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
          
          {/* NewsAPI offers 'relevancy', 'popularity', 'publishedAt'. Defaulting to 'publishedAt' in tool. */}
          <Select defaultValue="publishedAt" disabled={isLoading}>
            <SelectTrigger className="w-full sm:w-[180px] h-12 bg-input border-border focus:bg-card text-base">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="publishedAt">Latest</SelectItem>
              <SelectItem value="relevancy" disabled>Relevant (soon)</SelectItem> 
              <SelectItem value="popularity" disabled>Popular (soon)</SelectItem>
            </SelectContent>
          </Select>
           <Button type="submit" className="hidden" disabled={isLoading}>
            Search
          </Button>
        </form>
      </Form>
    </div>
  );
}
