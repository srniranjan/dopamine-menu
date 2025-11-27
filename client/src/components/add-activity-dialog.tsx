import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Coffee, Activity as ActivityIcon, Headphones, Smartphone, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertActivitySchema, type CategoryType, categoryColors } from "@shared/schema";
import { z } from "zod";

const formSchema = insertActivitySchema.extend({
  duration: z.coerce.number().min(0).optional(),
  emoji: z.string().min(1, "Please select an emoji"),
});

interface AddActivityDialogProps {
  category?: CategoryType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryOptions = [
  { value: "appetizers", label: "Appetizers", subtitle: "Quick 1-5 minute boosts", icon: Coffee },
  { value: "entrees", label: "Entrées", subtitle: "Main activities 15-60 minutes", icon: ActivityIcon },
  { value: "sides", label: "Sides", subtitle: "Background stimulation", icon: Headphones },
  { value: "desserts", label: "Desserts", subtitle: "Easy dopamine hits", icon: Smartphone },
  { value: "specials", label: "Specials", subtitle: "Planned treats", icon: Star },
];

export default function AddActivityDialog({ category, open, onOpenChange }: AddActivityDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: category || "appetizers",
      description: "",
      duration: 0,
      emoji: "",
    },
  });

  // Reset form when category changes
  React.useEffect(() => {
    if (category) {
      form.setValue("category", category);
    }
  }, [category, form]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/activities", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Activity added",
        description: "Your new activity has been added to the menu.",
        duration: 2000,
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add activity. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  const categoryName = category ? category.charAt(0).toUpperCase() + category.slice(1) : "Activity";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New {category ? categoryName.slice(0, -1) : "Activity"}</DialogTitle>
          <DialogDescription>
            {category ? `Add a new activity to your ${category.toLowerCase()} category.` : "Add a new activity to your dopamine menu."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!category && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => {
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded-full category-${categoryColors[option.value as CategoryType]}`} />
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-muted-foreground">{option.subtitle}</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Take a 5-minute walk" 
                      {...field} 
                      className="adhd-focus"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emoji</FormLabel>
                  <FormControl>
                    <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="adhd-focus h-12 w-full text-2xl"
                        >
                          {field.value || "🎯"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 border-none w-[320px]" align="start">
                        <EmojiPicker
                          searchDisabled
                          skinTonesDisabled
                          previewConfig={{ showPreview: false }}
                          onEmojiClick={({ emoji }: EmojiClickData) => {
                            field.onChange(emoji);
                            setEmojiPickerOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any notes or details about this activity..."
                      {...field} 
                      value={field.value || ""}
                      className="adhd-focus"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {(!category || category !== "sides") && (
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="15"
                        {...field} 
                        className="adhd-focus"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="adhd-focus"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="adhd-focus"
              >
                {createMutation.isPending ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Activity
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
