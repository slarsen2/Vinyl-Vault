import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FirestoreRecord, recordsService } from "@/lib/firebase-service";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Timestamp } from "firebase/firestore";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Save, X, Trash2 } from "lucide-react";

// Edit record schema
const editRecordSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  year: z.string().optional(),
  genre: z.string().optional(),
  coverImage: z.string().optional(),
  customFields: z.array(
    z.object({
      name: z.string().min(1, "Field name is required"),
      value: z.string().min(1, "Field value is required")
    })
  ).optional(),
});

type EditRecordFormValues = z.infer<typeof editRecordSchema>;

interface RecordDetailModalProps {
  record: FirestoreRecord;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export default function RecordDetailModal({ record, onClose, onDelete }: RecordDetailModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Convert record's customFields object to array for form
  const customFieldsArray = record.customFields
    ? Object.entries(record.customFields).map(([name, value]) => ({ name, value: value as string }))
    : [];
  
  // Form setup
  const form = useForm<EditRecordFormValues>({
    resolver: zodResolver(editRecordSchema),
    defaultValues: {
      title: record.title,
      artist: record.artist,
      year: record.year || "",
      genre: record.genre || "",
      coverImage: record.coverImage || "",
      customFields: customFieldsArray.length > 0 ? customFieldsArray : [{ name: "", value: "" }],
    },
  });
  
  // Custom fields handling
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customFields",
  });
  
  // Update record mutation
  const updateRecordMutation = useMutation({
    mutationFn: async (data: EditRecordFormValues) => {
      // Convert customFields array to object for storage
      const customFieldsObj = data.customFields?.reduce((acc, field) => {
        if (field.name && field.value) {
          return { ...acc, [field.name]: field.value };
        }
        return acc;
      }, {});
      
      const updatedRecord: Partial<FirestoreRecord> = {
        title: data.title,
        artist: data.artist,
        year: data.year,
        genre: data.genre,
        coverImage: data.coverImage,
        customFields: customFieldsObj,
      };
      
      if (!record.id) {
        throw new Error("Record ID is missing");
      }
      
      await recordsService.updateRecord(record.id, updatedRecord);
      return record.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', user?.uid] });
      setIsEditing(false);
      toast({
        title: "Record updated",
        description: "Your changes have been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    form.handleSubmit((data) => {
      updateRecordMutation.mutate(data);
    })();
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    form.reset({
      title: record.title,
      artist: record.artist,
      year: record.year || "",
      genre: record.genre || "",
      coverImage: record.coverImage || "",
      customFields: customFieldsArray.length > 0 ? customFieldsArray : [{ name: "", value: "" }],
    });
  };
  
  const defaultCoverImage = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=500&h=500";
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-charcoal text-cream p-0 max-w-4xl">
        <DialogTitle className="sr-only">Record Details</DialogTitle>
        <div className="flex flex-col md:flex-row">
          {/* Left side - Album Cover */}
          <div className="md:w-2/5 relative">
            <div className="aspect-square overflow-hidden">
              <img 
                src={form.watch("coverImage") || defaultCoverImage} 
                alt={`${record.artist} - ${record.title}`} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultCoverImage;
                }}
              />
            </div>
            
            <div className="absolute top-4 left-4 md:hidden">
              <Button
                variant="ghost"
                onClick={onClose}
                className="rounded-full bg-navy/50 hover:bg-navy text-amber h-10 w-10 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 vinyl-after bg-navy rounded-full record-grooves animate-spin-slow"></div>
            </div>
          </div>
          
          {/* Right side - Record Details */}
          <div className="md:w-3/5 p-6 relative">
            <div className="hidden md:block absolute top-4 right-4">
              <Button
                variant="ghost"
                onClick={onClose}
                className="rounded-full bg-navy/50 hover:bg-navy text-amber h-10 w-10 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {isEditing ? (
              // Edit Mode
              <form className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 w-full pr-16">
                    <div>
                      <Label htmlFor="edit-title">Title</Label>
                      <Input
                        id="edit-title"
                        className="bg-navy border-amber/30 focus:ring-amber"
                        {...form.register("title")}
                      />
                      {form.formState.errors.title && (
                        <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-artist">Artist</Label>
                      <Input
                        id="edit-artist"
                        className="bg-navy border-amber/30 focus:ring-amber"
                        {...form.register("artist")}
                      />
                      {form.formState.errors.artist && (
                        <p className="text-xs text-red-500">{form.formState.errors.artist.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute top-0 right-16 flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="p-2 bg-navy/30 hover:bg-navy border-amber/30 rounded-md transition-colors"
                      onClick={handleCancel}
                      title="Cancel"
                    >
                      <X className="h-5 w-5 text-amber" />
                    </Button>
                    <Button
                      type="button"
                      className="p-2 bg-burgundy hover:bg-burgundy/90 rounded-md transition-colors"
                      onClick={handleSave}
                      disabled={updateRecordMutation.isPending}
                      title="Save"
                    >
                      {updateRecordMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin text-cream" />
                      ) : (
                        <Save className="h-5 w-5 text-cream" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-year">Year</Label>
                    <Input
                      id="edit-year"
                      className="bg-navy border-amber/30 focus:ring-amber"
                      {...form.register("year")}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-genre">Genre</Label>
                    <Input
                      id="edit-genre"
                      className="bg-navy border-amber/30 focus:ring-amber"
                      {...form.register("genre")}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="edit-cover">Cover Image URL</Label>
                    <Input
                      id="edit-cover"
                      className="bg-navy border-amber/30 focus:ring-amber"
                      {...form.register("coverImage")}
                    />
                  </div>
                </div>
                
                {/* Custom Fields */}
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Custom Fields</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="text-amber p-0 h-auto"
                      onClick={() => append({ name: "", value: "" })}
                    >
                      <span className="mr-1">+</span> Add Field
                    </Button>
                  </div>
                  
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-4 gap-2 mb-2">
                      <div className="col-span-1">
                        <Input
                          placeholder="Field Name"
                          className="bg-navy border-amber/30 focus:ring-amber text-sm"
                          {...form.register(`customFields.${index}.name`)}
                        />
                      </div>
                      <div className="col-span-3 flex items-center">
                        <Input
                          placeholder="Field Value"
                          className="bg-navy border-amber/30 focus:ring-amber text-sm"
                          {...form.register(`customFields.${index}.value`)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="ml-1 p-1 text-burgundy hover:text-burgundy/80 h-9 w-9"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            ) : (
              // View Mode
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-heading font-bold text-amber">{record.title}</h2>
                    <p className="text-xl text-cream opacity-80">{record.artist}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="p-2 bg-burgundy/20 hover:bg-burgundy/30 rounded-md transition-colors border-none"
                      onClick={handleEdit}
                      title="Edit Record"
                    >
                      <Pencil className="h-5 w-5 text-burgundy" />
                    </Button>
                    
                    {/* Highly visible delete button */}
                    <Button
                      variant="destructive"
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                      onClick={() => {
                        console.log("Delete button clicked for record ID:", record.id);
                        if (record.id) {
                          if (window.confirm(`Are you sure you want to delete "${record.title}" by ${record.artist}?`)) {
                            console.log("Confirmed deletion of record ID:", record.id);
                            onDelete(record.id);
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-5 w-5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
                
                {record.genre && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="text-sm bg-burgundy/20 text-burgundy px-3 py-1 rounded-full">{record.genre}</span>
                  </div>
                )}
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {record.year && (
                    <div>
                      <h3 className="text-amber font-medium text-sm mb-1">Release Year</h3>
                      <p>{record.year}</p>
                    </div>
                  )}
                  
                  {/* Custom Fields */}
                  {record.customFields && Object.entries(record.customFields).map(([name, value]) => (
                    <div key={name}>
                      <h3 className="text-amber font-medium text-sm mb-1">{name}</h3>
                      <p>{value as string}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-amber/20">
                  <h3 className="text-amber font-medium mb-3">Added to collection</h3>
                  <p>{record.createdAt instanceof Timestamp 
                      ? record.createdAt.toDate().toLocaleDateString() 
                      : new Date(record.createdAt).toLocaleDateString()}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
