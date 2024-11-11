import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { AuctionItem } from "@/types/types";

const itemFormSchema = z.object({
    title: z.string()
        .min(3, "Название должно содержать минимум 3 символа")
        .max(100, "Название не должно превышать 100 символов"),
    description: z.string()
        .min(10, "Описание должно содержать минимум 10 символов")
        .max(1000, "Описание не должно превышать 1000 символов"),
    minStep: z.number()
        .min(1, "Минимальный шаг должен быть больше 0")
        .max(1000000, "Слишком большой шаг ставки")
});

interface EditAuctionItemDialogProps {
    auctionId: string;
    item: AuctionItem;
    onUpdate: (auctionId: string, updates: Partial<AuctionItem>) => Promise<void>;
    disabled?: boolean;
}

export function EditAuctionItemDialog({
                                          auctionId,
                                          item,
                                          onUpdate,
                                          disabled = false
                                      }: EditAuctionItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof itemFormSchema>>({
        resolver: zodResolver(itemFormSchema),
        defaultValues: {
            title: item.title,
            description: item.description,
            minStep: item.minStep,
        },
    });

    async function onSubmit(values: z.infer<typeof itemFormSchema>) {
        try {
            setIsLoading(true);
            await onUpdate(auctionId, values);

            toast({
                title: "Успешно",
                description: "Информация о предмете обновлена",
            });
            setOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось обновить информацию о предмете",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    disabled={disabled}
                >
                    <Pencil className="h-4 w-4 mr-2" />
                    Редактировать
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Редактирование предмета</DialogTitle>
                    <DialogDescription>
                        Измените информацию о предмете аукциона
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Название предмета</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Введите название предмета" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Описание</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Подробное описание предмета"
                                            className="h-32"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="minStep"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Минимальный шаг</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={e => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Минимальный шаг ставки в рублях
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Сохранение...
                                    </>
                                ) : (
                                    "Сохранить изменения"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}