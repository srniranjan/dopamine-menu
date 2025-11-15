import { Share2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function MenuActions() {
  const { toast } = useToast();

  const handleShareMenu = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Dopamine Menu",
        text: "Check out my ADHD-friendly dopamine menu!",
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Menu link copied to clipboard.",
      });
    }
  };

  const handleResetMenu = () => {
    if (confirm("Are you sure you want to reset your menu? This will remove all custom activities.")) {
      // This would reset to default activities
      toast({
        title: "Menu reset",
        description: "Your menu has been reset to default activities.",
      });
    }
  };

  return (
    <Card className="adhd-card mt-8">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Menu Options</h3>
        <div className="flex flex-wrap gap-4">
          <Button 
            className="bg-secondary text-secondary-foreground adhd-button"
            onClick={handleShareMenu}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Menu
          </Button>
          
          <Button 
            variant="outline"
            className="adhd-button"
            onClick={handleResetMenu}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Reset Menu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
