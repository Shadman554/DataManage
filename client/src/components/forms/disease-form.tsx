import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertDiseaseSchema } from '@shared/schema';
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save } from 'lucide-react';
import type { Disease, InsertDisease } from '@shared/schema';

interface DiseaseFormProps {
  item?: Disease;
  onSuccess: () => void;
}

export function DiseaseForm({ item, onSuccess }: DiseaseFormProps) {
  const isEditing = !!item;
  const { mutate: createDisease, isPending: isCreating } = useCreateDocument('diseases');
  const { mutate: updateDisease, isPending: isUpdating } = useUpdateDocument('diseases');
  const { toast } = useToast();

  const form = useForm<InsertDisease>({
    resolver: zodResolver(insertDiseaseSchema),
    defaultValues: {
      name: item?.name || '',
      kurdish: item?.kurdish || '',
      symptoms: item?.symptoms || '',
      cause: item?.cause || '',
      control: item?.control || '',
    },
  });

  const isLoading = isCreating || isUpdating;

  const onSubmit = (data: InsertDisease) => {
    if (isEditing) {
      updateDisease(
        { id: item.id, data },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Disease updated successfully.",
            });
            onSuccess();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update disease.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createDisease(data, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Disease created successfully.",
          });
          onSuccess();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create disease.",
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>English Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter English name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="kurdish"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kurdish Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Kurdish name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="symptoms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symptoms</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter symptoms" 
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
          name="cause"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cause</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter cause" 
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
          name="control"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Control & Treatment</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter control measures and treatment" 
                  className="min-h-[120px]"
                  {...field} 
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
            {isLoading ? 'Saving...' : (isEditing ? 'Update Disease' : 'Save Disease')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
