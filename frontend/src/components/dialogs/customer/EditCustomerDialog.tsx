import React, { useContext, useEffect, useRef } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, FormGroup, Box, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, CircularProgress } from '@mui/material';
import { CustomerUpdateDto, CustomerExtendedDto } from "../../../models/customer.ts";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { editCustomerSchema } from "../../../validationSchemas/forms.ts";
import { EditDialogProps, EditDialogContext } from "../../dataDisplay/CursorPaginatedDataGrid.tsx";
import { useProducts } from '../../../hooks/useProducts';

const EditCustomerDialog: React.FC = () => {
    const { isOpen, close, editEntity, useEntityExtended, targetEntityId }: EditDialogProps<CustomerExtendedDto, CustomerUpdateDto> = useContext(EditDialogContext);

    const { data: targetEntity, isLoading, error } = useEntityExtended(targetEntityId);

    const { handleSubmit, formState: { errors }, register, control, reset, setValue } = useForm<CustomerUpdateDto>({
        resolver: zodResolver(editCustomerSchema),
    });

    const {
        data: products,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useProducts();

    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const handleProductScroll = (event: React.UIEvent<HTMLDivElement>) => {
        if (hasNextPage && !isFetchingNextPage && event.currentTarget.scrollTop + event.currentTarget.clientHeight >= event.currentTarget.scrollHeight) {
            fetchNextPage();
        }
    };

    useEffect(() => {
        if (loadMoreRef.current && hasNextPage && !isFetchingNextPage) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            }, { threshold: 1.0 });
            observer.observe(loadMoreRef.current);
            return () => observer.disconnect();
        }
    }, [loadMoreRef.current, hasNextPage, isFetchingNextPage]);

    useEffect(() => {
        if (targetEntity) {
            const initialValues = {
                ...targetEntity,
                productIds: targetEntity.products.map(product => product.id)
            };
            reset(initialValues);
        }
    }, [targetEntity, reset]);

    const onUpdateCustomer = async (data: CustomerUpdateDto) => {
        if (data.productIds && data.productIds.length === 0) {
            alert("Please select at least one product.");
            return;
        }
        await editEntity(targetEntityId, data);
        close();
    };

    const sortedProducts = products?.pages.flatMap(page => page).sort((a, b) => a.name.localeCompare(b.name)) || [];

    return (
        <Dialog open={isOpen} onClose={close} maxWidth="md" fullWidth>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogContent dividers>
                <Box component={FormGroup} mb={3} sx={{ '& > *': { marginBottom: 2 } }}>
                    <TextField
                        label="Name"
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        fullWidth
                        {...register("name")}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        label="Surname"
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        fullWidth
                        {...register("surname")}
                        error={!!errors.surname}
                        helperText={errors.surname?.message}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        label="Email"
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        fullWidth
                        {...register("email")}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        label="Phone Number"
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        fullWidth
                        {...register("phoneNumber")}
                        error={!!errors.phoneNumber}
                        helperText={errors.phoneNumber?.message}
                        sx={{ mt: 2 }}
                    />
                    <FormControl sx={{ mt: 2 }} fullWidth error={!!errors.productIds}>
                        <InputLabel id="product-label">Products</InputLabel>
                        <Controller
                            control={control}
                            name="productIds"
                            render={({ field }) => (
                                <Select
                                    labelId="product-label"
                                    multiple
                                    {...field}
                                    value={field.value ?? []}
                                    renderValue={(selected) => {
                                        const selectedProducts = sortedProducts.filter(product => selected.includes(product.id));
                                        return selectedProducts.map(product => product.name).join(', ') || '';
                                    }}
                                    MenuProps={{ onScroll: handleProductScroll }}
                                >
                                    {sortedProducts.map((product) => (
                                        <MenuItem key={product.id} value={product.id}>
                                            <Checkbox checked={field.value ? field.value.includes(product.id) : false} />
                                            <ListItemText primary={product.name} />
                                        </MenuItem>
                                    ))}
                                    {isFetchingNextPage && (
                                        <MenuItem disabled>
                                            <CircularProgress size={24} />
                                        </MenuItem>
                                    )}
                                </Select>
                            )}
                        />
                        {errors.productIds && <p>{errors.productIds.message}</p>}
                    </FormControl>
                </Box>
                <div ref={loadMoreRef} />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleSubmit(onUpdateCustomer)} color="primary">Update Customer</Button>
                <Button onClick={close} color="error">Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditCustomerDialog;