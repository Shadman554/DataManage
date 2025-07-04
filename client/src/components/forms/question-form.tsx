import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertQuestionSchema } from '@shared/schema';
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save } from 'lucide-react';
import type { Question, InsertQuestion } from '@shared/schema';

interface QuestionFormProps {
  item?: Question;
  onSuccess: () => void;
}

export function QuestionForm({ item, onSuccess }: QuestionFormProps) {
  const isEditing = !!item;
  const { mutate: createQuestion, isPending: isCreating } = useCreateDocument('questions');
  const { mutate: updateQuestion, isPending: isUpdating } = useUpdateDocument('questions');
  const { toast } = useToast();

  const form = useForm<InsertQuestion>({
    resolver: zodResolver(insertQuestionSchema),
    defaultValues: {
      text: item?.text || '',
      userName: item?.userName || '',
      userEmail: item?.userEmail || '',
      userPhoto: item?.userPhoto || '',
      userId: item?.userId || '',
      likes: item?.likes || 0,
      timestamp: item?.timestamp || {
        _seconds: Math.floor(Date.now() / 1000),
        _nanoseconds: 0,
      },
    },
  });

  const isLoading = isCreating || isUpdating;

  const onSubmit = (data: InsertQuestion) => {
    const submitData = {
      ...data,
      timestamp: {
        _seconds: Math.floor(Date.now() / 1000),
        _nanoseconds: 0,
      },
    };

    if (isEditing) {
      updateQuestion(
        { id: item.id, data: submitData },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Question updated successfully.",
            });
            onSuccess();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update question.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createQuestion(submitData, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Question created successfully.",
          });
          onSuccess();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create question.",
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
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter question text" 
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter user name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="userEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter user email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter user ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="likes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Likes Count</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter likes count" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="userPhoto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Photo URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter user photo URL" {...field} />
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
            {isLoading ? 'Saving...' : (isEditing ? 'Update Question' : 'Save Question')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
