import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertBookSchema } from '@shared/schema';
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FileUpload } from '@/components/file-upload';
import { Save } from 'lucide-react';
import type { Book, InsertBook } from '@shared/schema';

interface BookFormProps {
  item?: Book;
  onSuccess: () => void;
}

const categories = [
  'کتێبە کوردیەکان',
  'کتێبە ئینگلیزیەکان',
];

export function BookForm({ item, onSuccess }: BookFormProps) {
  const isEditing = !!item;
  const { mutate: createBook, isPending: isCreating } = useCreateDocument('books');
  const { mutate: updateBook, isPending: isUpdating } = useUpdateDocument('books');
  const { toast } = useToast();

  const form = useForm<InsertBook>({
    resolver: zodResolver(insertBookSchema),
    defaultValues: {
      title: item?.title || '',
      description: item?.description || '',
      category: item?.category || '',
      coverImageUrl: item?.coverImageUrl || '',
      pdfUrl: item?.pdfUrl || '',
    },
  });

  const isLoading = isCreating || isUpdating;

  const onSubmit = (data: InsertBook) => {
    if (isEditing) {
      updateBook(
        { id: item.id, data },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Book updated successfully.",
            });
            onSuccess();
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: "Failed to update book.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createBook(data, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Book created successfully.",
          });
          onSuccess();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to create book.",
            variant: "destructive",
          });
        },
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Book Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter book title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter book description" 
                  className="min-h-[100px]"
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
            name="coverImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image</FormLabel>
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
          
          <FormField
            control={form.control}
            name="pdfUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PDF File</FormLabel>
                <FormControl>
                  <FileUpload
                    accept=".pdf"
                    onUpload={field.onChange}
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
            {isLoading ? 'Saving...' : (isEditing ? 'Update Book' : 'Save Book')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
