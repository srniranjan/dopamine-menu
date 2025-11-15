import { useState } from "react";
import { Plus, Coffee, Activity as ActivityIcon, Headphones, Smartphone, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ActivityItem from "./activity-item";
import AddActivityDialog from "./add-activity-dialog";
import type { Activity, CategoryType } from "@shared/schema";
import { categoryDescriptions, categoryColors } from "@shared/schema";

interface MenuCategoryProps {
  category: CategoryType;
  activities: Activity[];
  isSpecials?: boolean;
  onActivityStart?: (activity: Activity) => void;
}

const categoryIcons = {
  appetizers: Coffee,
  entrees: ActivityIcon,
  snacks: Coffee,
  desserts: Smartphone,
  sides: Headphones,
  specials: Star,
};

export default function MenuCategory({ category, activities, isSpecials = false, onActivityStart }: MenuCategoryProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const Icon = categoryIcons[category];
  const colorClass = `category-${categoryColors[category]}`;
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className={isSpecials ? "mt-8" : ""}>
      <Card className="adhd-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">{categoryName}</h3>
                <p className="text-sm text-muted-foreground">{categoryDescriptions[category]}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${colorClass} adhd-focus`}
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          
          <div className={isSpecials ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {activities.map((activity) => (
              <ActivityItem 
                key={activity.id} 
                activity={activity}
                colorClass={colorClass}
                onActivityStart={onActivityStart}
              />
            ))}
          </div>
          
          <Button 
            variant="outline" 
            className={`w-full mt-4 p-3 border-2 border-dashed transition-colors adhd-focus hover:${colorClass}`}
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New {categoryName.slice(0, -1)}
          </Button>
        </CardContent>
      </Card>

      <AddActivityDialog
        category={category}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
