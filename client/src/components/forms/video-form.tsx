import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertTutorialVideoSchema } from '@shared/schema';
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save } from 'lucide-react';
import type { TutorialVideo, InsertTutorialVideo } from '@shared/schema';

interface VideoFormProps {
  item?: TutorialVideo;
  onSuccess: () => void;
}

export function VideoForm({ item, onSuccess }: VideoFormProps) {
  const isEditing = !!item;
  const { mutate: createVideo, isPending: isCreating } = useCreateDocument('tutorialVideos');
  const { mutate: updateVideo, isPending: isUpdating } = useUpdateDocument('tutorialVideos');
  const { toast } = useToast();

  const form = useForm<InsertTutorialVideo>({
    resolver: zodResolver(insertTutorialVideoSchema),
    defaultValues: {
      Title: item?.Title || '',
      VideoID: item?.VideoID || '',
    },
  });

  const isLoading = isCreating || isUpdating;

  const onSubmit = (data: InsertTutorialVideo) => {
    if (isEditing) {
      updateVideo(
        { id: item.id, data },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Video updated successfully.",
            });
            onSuccess();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update video.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createVideo(data, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Video created successfully.",
          });
          onSuccess();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create video.",
            variant: "destructive",
          });
        },
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="Title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter video title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="VideoID"
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube Video ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter YouTube video ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : (isEditing ? 'Update Video' : 'Save Video')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
