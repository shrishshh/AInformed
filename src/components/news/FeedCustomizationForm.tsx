
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenerateNewsFeedInput } from "@/ai/flows/generate-news-feed"; // Input type for the flow
import { Search } from "lucide-react";
import React from "react";

// Form schema based on what the user interacts with
const formSchema = z.object({
  searchQuery: z.string().min(1, "Search query is required."),
  // numberOfArticles could be an advanced option later, for now use default from page.tsx
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

  // Update form default value if initialValues.searchQuery changes after mount
  React.useEffect(() => {
    if (initialValues?.searchQuery) {
      form.reset({ searchQuery: initialValues.searchQuery });
    }
  }, [initialValues?.searchQuery, form]);

  const handleSubmit: SubmitHandler<FormData> = (data) => {
    // Adapt the form data to the GenerateNewsFeedInput structure
    const backendInput: GenerateNewsFeedInput = {
      searchQuery: data.searchQuery,
      numberOfArticles: initialValues?.numberOfArticles || 15, // Use default or stored number
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
                      placeholder="Search live news articles..." 
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
          
          {/* Sort functionality is mocked visually / could be implemented with NewsAPI sort options */}
          <Select defaultValue="publishedAt" disabled={isLoading}>
            <SelectTrigger className="w-full sm:w-[180px] h-12 bg-input border-border focus:bg-card text-base">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="publishedAt">Latest</SelectItem>
              <SelectItem value="relevancy">Relevant</SelectItem>
              <SelectItem value="popularity">Popular</SelectItem>
            </SelectContent>
          </Select>
          {/* Hidden submit button, form submitted on Enter in search input or explicit button for accessibility if needed */}
           <Button type="submit" className="hidden" disabled={isLoading}>
            Search
          </Button>
        </form>
      </Form>
    </div>
  );
}
