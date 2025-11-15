import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Coffee, Activity as ActivityIcon, Headphones, Smartphone, Star } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertActivitySchema, type CategoryType, categoryColors, type Activity } from "@shared/schema";
import { z } from "zod";

const formSchema = insertActivitySchema.extend({
  duration: z.coerce.number().min(0).optional(),
});

interface EditActivityDialogProps {
  activity: Activity;
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

export default function EditActivityDialog({ activity, open, onOpenChange }: EditActivityDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: activity.name,
      category: activity.category,
      description: activity.description || "",
      duration: activity.duration || 0,
    },
  });

  // Reset form when activity changes
  React.useEffect(() => {
    if (activity) {
      form.reset({
        name: activity.name,
        category: activity.category,
        description: activity.description || "",
        duration: activity.duration || 0,
      });
    }
  }, [activity, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("PUT", `/api/activities/${activity.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Activity updated",
        description: "Your activity has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
          <DialogDescription>
            Update your activity details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Take a 5-minute walk" {...field} className="rounded-none" />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this activity involves..."
                      {...field}
                      className="rounded-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes, optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 5" 
                      {...field}
                      className="rounded-none"
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-10" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Activity"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}