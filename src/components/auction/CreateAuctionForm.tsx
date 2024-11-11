import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { FirebaseService } from "@/lib/services/firebase-service";
import { Loader2 } from "lucide-react";

const auctionFormSchema = z.object({
    title: z.string()
        .min(3, "Название должно содержать минимум 3 символа")
        .max(100, "Название не должно превышать 100 символов"),
    description: z.string()
        .min(10, "Описание должно содержать минимум 10 символов")
        .max(1000, "Описание не должно превышать 1000 символов"),
    startPrice: z.number()
        .min(1, "Начальная цена должна быть больше 0")
        .max(1000000000, "Начальная цена не должна превышать 1 млрд"),
    minStep: z.number()
        .min(1, "Минимальный шаг должен быть больше 0")
});

export function CreateAuctionForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof auctionFormSchema>>({
        resolver: zodResolver(auctionFormSchema),
        defaultValues: {
            title: "",
            description: "",
            startPrice: 0,
            minStep: 1,
        },
    });

    async function onSubmit(values: z.infer<typeof auctionFormSchema>) {
        try {
            setIsLoading(true);

            await FirebaseService.createAuction({
                item: {
                    title: values.title,
                    description: values.description,
                    startPrice: values.startPrice,
                    minStep: values.minStep,
                },
                currentPrice: values.startPrice,
            });

            toast({
                title: "Аукцион создан",
                description: "Теперь вы можете добавлять участников",
            });

            setTimeout(() => {
                window.location.href = '/organizer';
            }, 500);

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: error instanceof Error ? error.message : "Не удалось создать аукцион",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
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
                            <FormDescription>
                                Краткое название предмета торгов
                            </FormDescription>
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
                            <FormDescription>
                                Детальное описание предмета торгов
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="startPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Начальная цена</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Стартовая цена в рублях
                                </FormDescription>
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
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Создание...
                        </>
                    ) : (
                        "Создать аукцион"
                    )}
                </Button>
            </form>
        </Form>
    );
}