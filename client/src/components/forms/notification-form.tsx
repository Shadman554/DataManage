import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertNotificationSchema } from '@shared/schema';
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FileUpload } from '@/components/file-upload';
import { Save } from 'lucide-react';
import type { Notification, InsertNotification } from '@shared/schema';

interface NotificationFormProps {
  item?: Notification;
  onSuccess: () => void;
}

export function NotificationForm({ item, onSuccess }: NotificationFormProps) {
  const isEditing = !!item;
  const { mutate: createNotification, isPending: isCreating } = useCreateDocument('notifications');
  const { mutate: updateNotification, isPending: isUpdating } = useUpdateDocument('notifications');
  const { toast } = useToast();

  const form = useForm<InsertNotification>({
    resolver: zodResolver(insertNotificationSchema),
    defaultValues: {
      title: item?.title || '',
      body: item?.body || '',
      imageUrl: item?.imageUrl || '',
      timestamp: item?.timestamp || {
        _seconds: Math.floor(Date.now() / 1000),
        _nanoseconds: 0,
      },
    },
  });

  const isLoading = isCreating || isUpdating;

  const onSubmit = (data: InsertNotification) => {
    const submitData = {
      ...data,
      timestamp: {
        _seconds: Math.floor(Date.now() / 1000),
        _nanoseconds: 0,
      },
    };

    if (isEditing) {
      updateNotification(
        { id: item.id, data: submitData },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Notification updated successfully.",
            });
            onSuccess();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update notification.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createNotification(submitData, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Notification created successfully.",
          });
          onSuccess();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create notification.",
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter notification title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Body</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter notification message" 
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image (Optional)</FormLabel>
              <FormControl>
                <FileUpload
                  accept="image/*"
                  onUpload={field.onChange}
                  preview={true}
                />
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
            {isLoading ? 'Saving...' : (isEditing ? 'Update Notification' : 'Save Notification')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
