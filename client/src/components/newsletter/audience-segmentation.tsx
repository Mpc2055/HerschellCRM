import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEMBERSHIP_TIERS } from "@/lib/constants";

interface AudienceSegmentationProps {
  value: any;
  onChange: (value: any) => void;
}

const AudienceSegmentation: React.FC<AudienceSegmentationProps> = ({ 
  value = {
    tiers: [],
    tags: [],
    joinDateStart: null,
    joinDateEnd: null,
    count: 0
  }, 
  onChange 
}) => {
  // State for each segmentation option
  const [selectedTiers, setSelectedTiers] = useState<string[]>(value.tiers || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(value.tags || []);
  const [joinDateStart, setJoinDateStart] = useState<Date | undefined>(value.joinDateStart ? new Date(value.joinDateStart) : undefined);
  const [joinDateEnd, setJoinDateEnd] = useState<Date | undefined>(value.joinDateEnd ? new Date(value.joinDateEnd) : undefined);
  const [newTag, setNewTag] = useState("");
  const [segmentationType, setSegmentationType] = useState<string>(
    value.tiers?.length ? "tier" :
    value.joinDateStart ? "date" :
    value.tags?.length ? "tag" : "all"
  );

  // Fetch member count
  const { data: memberCountData, isLoading } = useQuery({
    queryKey: ["/api/members/count"],
    enabled: false, // We'll manually refetch this when needed
  });

  // All available tags (in a real implementation, these would be fetched from the API)
  const availableTags = [
    "event-attendee",
    "donor",
    "volunteer",
    "new-member",
    "newsletter-subscriber",
    ...selectedTags.filter(tag => !["event-attendee", "donor", "volunteer", "new-member", "newsletter-subscriber"].includes(tag))
  ];

  // Update parent component when segmentation changes
  useEffect(() => {
    let count = memberCountData?.count || value.count || 0;
    
    const newValue = {
      tiers: segmentationType === "tier" ? selectedTiers : [],
      tags: segmentationType === "tag" ? selectedTags : [],
      joinDateStart: segmentationType === "date" && joinDateStart ? joinDateStart.toISOString() : null,
      joinDateEnd: segmentationType === "date" && joinDateEnd ? joinDateEnd.toISOString() : null,
      count
    };
    
    onChange(newValue);
  }, [segmentationType, selectedTiers, selectedTags, joinDateStart, joinDateEnd, memberCountData]);

  // Handle adding a new tag
  const handleAddTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
      setNewTag("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audience Segmentation</CardTitle>
        <CardDescription>
          Define who should receive this newsletter by selecting one of the segmentation options below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={segmentationType} onValueChange={setSegmentationType}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Members</TabsTrigger>
            <TabsTrigger value="tier">By Tier</TabsTrigger>
            <TabsTrigger value="date">By Join Date</TabsTrigger>
            <TabsTrigger value="tag">By Tag</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <div className="bg-muted/50 rounded-md p-4">
              <p className="text-sm text-muted-foreground">
                This newsletter will be sent to all active members ({value.count || "calculating..."}).
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="tier" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {MEMBERSHIP_TIERS.map((tier) => (
                  <div 
                    key={tier.id} 
                    className={cn(
                      "border rounded-md p-4 cursor-pointer transition-colors",
                      selectedTiers.includes(tier.id) 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-gray-400"
                    )}
                    onClick={() => {
                      if (selectedTiers.includes(tier.id)) {
                        setSelectedTiers(selectedTiers.filter(t => t !== tier.id));
                      } else {
                        setSelectedTiers([...selectedTiers, tier.id]);
                      }
                    }}
                  >
                    <div className="flex items-start">
                      <Checkbox 
                        checked={selectedTiers.includes(tier.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTiers([...selectedTiers, tier.id]);
                          } else {
                            setSelectedTiers(selectedTiers.filter(t => t !== tier.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <Label className="text-base font-medium">{tier.name}</Label>
                        <p className="text-sm text-muted-foreground">${tier.price}/year</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="date" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Join Date Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !joinDateStart && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {joinDateStart ? format(joinDateStart, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={joinDateStart}
                        onSelect={setJoinDateStart}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Join Date End</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !joinDateEnd && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {joinDateEnd ? format(joinDateEnd, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={joinDateEnd}
                        onSelect={setJoinDateEnd}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-md p-4">
                <p className="text-sm text-muted-foreground">
                  {joinDateStart && joinDateEnd ? (
                    <>Targeting members who joined between {format(joinDateStart, "MMMM d, yyyy")} and {format(joinDateEnd, "MMMM d, yyyy")}.</>
                  ) : joinDateStart ? (
                    <>Targeting members who joined after {format(joinDateStart, "MMMM d, yyyy")}.</>
                  ) : joinDateEnd ? (
                    <>Targeting members who joined before {format(joinDateEnd, "MMMM d, yyyy")}.</>
                  ) : (
                    <>Select a date range to target members by their join date.</>
                  )}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tag" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Available Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          handleRemoveTag(tag);
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <span className="ml-1" onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(tag);
                        }}>
                          &times;
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a custom tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTag) {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} disabled={!newTag}>
                  Add
                </Button>
              </div>
              
              {selectedTags.length > 0 && (
                <div className="bg-muted/50 rounded-md p-4">
                  <p className="text-sm text-muted-foreground">
                    Targeting members with the following tags: {selectedTags.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="bg-muted/50 border-t">
        <div className="flex justify-between items-center w-full">
          <div>
            <span className="text-sm font-medium">Estimated Recipients:</span>
            <span className="text-sm ml-2">
              {isLoading ? "Calculating..." : value.count || "All active members"}
            </span>
          </div>
          <Button variant="outline" type="button">
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Count
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AudienceSegmentation;
