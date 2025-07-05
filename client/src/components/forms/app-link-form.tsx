import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertAppLinkSchema } from '@shared/schema';
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save } from 'lucide-react';
import type { AppLink, InsertAppLink } from '@shared/schema';

interface AppLinkFormProps {
  item?: AppLink;
  onSuccess: () => void;
}

export function AppLinkForm({ item, onSuccess }: AppLinkFormProps) {
  const isEditing = !!item;
  const { mutate: createAppLink, isPending: isCreating } = useCreateDocument('appLinks');
  const { mutate: updateAppLink, isPending: isUpdating } = useUpdateDocument('appLinks');
  const { toast } = useToast();

  const form = useForm<InsertAppLink>({
    resolver: zodResolver(insertAppLinkSchema),
    defaultValues: {
      url: item?.url || '',
    },
  });

  const isLoading = isCreating || isUpdating;

  const onSubmit = (data: InsertAppLink) => {
    if (isEditing) {
      updateAppLink(
        { id: item.id, data },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "App link updated successfully.",
            });
            onSuccess();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update app link.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createAppLink(data, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "App link created successfully.",
          });
          onSuccess();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create app link.",
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
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App Download URL</FormLabel>
              <FormControl>
                <Input 
                  type="url" 
                  placeholder="Enter app download URL (e.g., https://play.google.com/store/apps/...)" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium text-sm text-foreground mb-2">URL Examples:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Android: https://play.google.com/store/apps/details?id=com.yourapp</li>
            <li>• iOS: https://apps.apple.com/us/app/your-app/id123456789</li>
            <li>• Direct APK: https://your-domain.com/app.apk</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : (isEditing ? 'Update App Link' : 'Save App Link')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
