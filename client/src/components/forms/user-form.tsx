import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertUserSchema } from '@shared/schema';
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save } from 'lucide-react';
import type { User, InsertUser } from '@shared/schema';

interface UserFormProps {
  item?: User;
  onSuccess: () => void;
}

export function UserForm({ item, onSuccess }: UserFormProps) {
  const isEditing = !!item;
  const { mutate: createUser, isPending: isCreating } = useCreateDocument('users');
  const { mutate: updateUser, isPending: isUpdating } = useUpdateDocument('users');
  const { toast } = useToast();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: item?.username || '',
      today_points: item?.today_points || 0,
      total_points: item?.total_points || 0,
      last_updated: item?.last_updated || {
        _seconds: Math.floor(Date.now() / 1000),
        _nanoseconds: 0,
      },
    },
  });

  const isLoading = isCreating || isUpdating;

  const onSubmit = (data: InsertUser) => {
    const submitData = {
      ...data,
      last_updated: {
        _seconds: Math.floor(Date.now() / 1000),
        _nanoseconds: 0,
      },
    };

    if (isEditing) {
      updateUser(
        { id: item.id, data: submitData },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "User updated successfully.",
            });
            onSuccess();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update user.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createUser(submitData, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "User created successfully.",
          });
          onSuccess();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create user.",
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="today_points"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Today's Points</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter today's points" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="total_points"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Points</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter total points" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : (isEditing ? 'Update User' : 'Save User')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
