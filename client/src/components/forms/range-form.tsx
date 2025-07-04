import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertNormalRangeSchema } from '@shared/schema';
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save } from 'lucide-react';
import type { NormalRange, InsertNormalRange } from '@shared/schema';

interface RangeFormProps {
  item?: NormalRange;
  onSuccess: () => void;
}

const species = [
  'Canine',
  'Feline',
  'Bovine',
  'Equine',
  'Ovine',
  'Caprine',
  'Porcine',
  'Avian',
];

const categories = [
  'Hematology',
  'Biochemistry',
  'Immunology',
  'Endocrinology',
  'Cardiology',
  'Nephrology',
];

export function RangeForm({ item, onSuccess }: RangeFormProps) {
  const isEditing = !!item;
  const { mutate: createRange, isPending: isCreating } = useCreateDocument('normalRanges');
  const { mutate: updateRange, isPending: isUpdating } = useUpdateDocument('normalRanges');
  const { toast } = useToast();

  const form = useForm<InsertNormalRange>({
    resolver: zodResolver(insertNormalRangeSchema),
    defaultValues: {
      name: item?.name || '',
      unit: item?.unit || '',
      minValue: item?.minValue || '',
      maxValue: item?.maxValue || '',
      species: item?.species || '',
      category: item?.category || '',
    },
  });

  const isLoading = isCreating || isUpdating;

  const onSubmit = (data: InsertNormalRange) => {
    if (isEditing) {
      updateRange(
        { id: item.id, data },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Normal range updated successfully.",
            });
            onSuccess();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update normal range.",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createRange(data, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Normal range created successfully.",
          });
          onSuccess();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create normal range.",
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
                <FormLabel>Parameter Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter parameter name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input placeholder="Enter unit (e.g., %, mg/dL)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="minValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Value</FormLabel>
                <FormControl>
                  <Input placeholder="Enter minimum value" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="maxValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Value</FormLabel>
                <FormControl>
                  <Input placeholder="Enter maximum value" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="species"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Species</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {species.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : (isEditing ? 'Update Range' : 'Save Range')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
