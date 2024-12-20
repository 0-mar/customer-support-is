import React from 'react';
import Page from '../../components/base/Page';
import { Typography } from '@mui/material';
import { useCustomers, useCustomer, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../../hooks/useCustomers.ts';
import {
    CustomerDto,
    CustomerExtendedDto,
    CustomerCreateDto,
    CustomerUpdateDto,
    CustomerFilters
} from '../../models/customer';
import CreateCustomerDialog from '../../components/dialogs/customer/CreateCustomerDialog.tsx';
import EditCustomerDialog from '../../components/dialogs/customer/EditCustomerDialog.tsx';
import DetailCustomerDialog from '../../components/dialogs/customer/DetailCustomerDialog.tsx';
import DeleteCustomerDialog from '../../components/dialogs/customer/DeleteCustomerDialog.tsx';
import CursorPaginatedDataGrid from '../../components/dataDisplay/CursorPaginatedDataGrid.tsx';

const CustomerManagement: React.FC = () => {
    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'name', headerName: 'Name', width: 200 },
        { field: 'surname', headerName: 'Surname', width: 200 },
    ];

    return (
        <Page title="Customer Management">
            <Typography component="h1" variant="h5">
                Customer Management
            </Typography>
            <CursorPaginatedDataGrid<CustomerDto, CustomerExtendedDto, CustomerCreateDto, CustomerUpdateDto, CustomerFilters>
                useEntitiesHook={useCustomers}
                useEntityHook={useCustomer}
                useCreateEntityHook={useCreateCustomer}
                useUpdateEntityHook={useUpdateCustomer}
                useDeleteEntityHook={useDeleteCustomer}
                columns={columns}
                createFilterObject={(model) => { return {
                    id: model.items.find(item => item.field === 'id')?.value ?? undefined,
                    name: model.items.find(item => item.field === 'name')?.value ?? undefined,
                    surname: model.items.find(item => item.field === 'surname')?.value ?? undefined,
                }}}
                createDialog={<CreateCustomerDialog />}
                editDialog={<EditCustomerDialog />}
                detailDialog={<DetailCustomerDialog />}
                deleteDialog={<DeleteCustomerDialog />}
            />
        </Page>
    );
};

export default CustomerManagement;
