import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertDrugSchema } from '@shared/schema';
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save } from 'lucide-react';
import type { Drug, InsertDrug } from '@shared/schema';

interface DrugFormProps {
  item?: Drug;
  onSuccess: () => void;
}

const drugClasses = [
  'Anesthesia',
  'Antibiotics',
  'Antiparasitic',
  'Anti-inflammatory',
  'Antifungal',
  'Analgesic',
  'Sedative',
  'Vaccine',
];

export function DrugForm({ item, onSuccess }: DrugFormProps) {
  const isEditing = !!item;
  const { mutate: createDrug, isPending: isCreating } = useCreateDocument('drugs');
  const { mutate: updateDrug, isPending: isUpdating } = useUpdateDocument('drugs');
  const { toast } = useToast();

  const form = useForm<InsertDrug>({
    resolver: zodResolver(insertDrugSchema),
    defaultValues: {
      name: item?.name || '',
      usage: item?.usage || '',
      sideEffect: item?.sideEffect || '',
      otherInfo: item?.otherInfo || '',
      class: item?.class || '',
    },
  });

  const isLoading = isCreating || isUpdating;

  const onSubmit = (data: InsertDrug) => {
    if (isEditing) {
      updateDrug(
        { id: item.id, data },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Drug updated successfully.",
            });
            onSuccess();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update drug.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createDrug(data, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Drug created successfully.",
          });
          onSuccess();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create drug.",
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
                <FormLabel>Drug Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter drug name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Drug Class</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select drug class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {drugClasses.map((drugClass) => (
                      <SelectItem key={drugClass} value={drugClass}>
                        {drugClass}
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
          name="usage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usage</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter usage instructions" 
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
          name="sideEffect"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Side Effects</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter side effects" 
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
          name="otherInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Other Information</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter additional information" 
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
            {isLoading ? 'Saving...' : (isEditing ? 'Update Drug' : 'Save Drug')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
