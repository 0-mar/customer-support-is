import React, {createContext, useState} from 'react';
import {
    DataGrid, GridColDef,
    GridPaginationMeta,
    GridPaginationModel, GridRenderCellParams,
    GridValidRowModel
} from '@mui/x-data-grid';
import {GET_MANY_SIZE} from "../../api/apiService.ts";
import {InfiniteData, UseInfiniteQueryResult, UseMutationResult, UseQueryResult} from "@tanstack/react-query";
import {Button} from "@mui/material";
import {BaseModelId} from "../../models/base.ts";
import useAuth from "../../hooks/useAuth.ts";
import {RoleValues} from "../../models/user.ts";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Authorized from "../auth/Authorized.tsx";

type CursorPaginatedDataGridProps<TDto, TExtendedDto, TCreateDto, TUpdateDto> = {
    useEntitesHook: () => UseInfiniteQueryResult<InfiniteData<TDto[], unknown>, Error>
    useEntityHook: (id: number) =>  UseQueryResult<TExtendedDto, Error>
    useCreateEntityHook: () => UseMutationResult<TDto, Error, TCreateDto, unknown>
    useUpdateEntityHook: () =>   UseMutationResult<TDto, Error, {id: number, updateData: TUpdateDto}, unknown>
    useDeleteEntityHook: () =>   UseMutationResult<TDto, Error, number, unknown>
    columns: GridColDef[]
    createDialog: React.ReactElement
    editDialog: React.ReactElement
    detailDialog: React.ReactElement
}

export interface CreateDialogProps<TCreateDto> {
    isOpen: boolean,
    close: () => void,
    createEntity: (createData: TCreateDto) => Promise<void>
}

export const CreateDialogContext = createContext({
    isOpen: false,
    close: () => { return; },
    createEntity: async (_obj: any) => { return; },
});

export interface EditDialogProps<TExtendedDto, TUpdateDto> {
    isOpen: boolean;
    close: () => void;
    editEntity: (id: number, updateData: TUpdateDto) => Promise<void>;
    useEntityExtended: (id: number) =>  UseQueryResult<TExtendedDto, Error>
    targetEntityId: number;
}

const a: any = 5
export const EditDialogContext = createContext({
    isOpen: false,
    close: () => { return; },
    editEntity: async (_id: number, _obj: any) => { return; },
    useEntityExtended: (_id: number) => a,
    targetEntityId: -1
});

export interface DetailDialogProps<TExtendedDto> {
    isOpen: boolean;
    close: () => void;
    useEntityExtended: (id: number) =>  UseQueryResult<TExtendedDto, Error>
    targetEntityId: number;
}

export const DetailDialogContext = createContext({
    isOpen: false,
    close: () => { return; },
    useEntityExtended: (_id: number) => a,
    targetEntityId: -1
});

/**
 * CursorPaginatedDataGrid bere 4 typove parametry - Obycejne DTO, Extended DTO, Create DTO a Update DTO.
 * Props parametry:
 *
 * - useEntitesHook - hook na fetchovaní po dávkách pomocí kurzorové paginace
 * - useEntityHook - hook, ktery vraci EXTENDED entitu pod urcitym ID
 * - useCreateEntityHook - hook, ktery vytvori entitu (bere TCreateDto jako parametr)
 * - useDeleteEntityHook - hook, ktery smaze entitu pod urcitym ID
 * - columns - definice sloupecku, ktere se maji zobrazit v DataGridu
 *
 * - pak nasleduji dialogy na vytvareni, mazani a upravu
 */
const CursorPaginatedDataGrid = <TDto extends BaseModelId & GridValidRowModel, TExtendedDto, TCreateDto, TUpdateDto>(props: CursorPaginatedDataGridProps<TDto, TExtendedDto, TCreateDto, TUpdateDto>) => {
    const {useEntitesHook, useEntityHook, useCreateEntityHook, useUpdateEntityHook, useDeleteEntityHook, columns, createDialog, editDialog, detailDialog} = props

    const createMutation = useCreateEntityHook();
    const updateMutation = useUpdateEntityHook();
    const deleteMutation = useDeleteEntityHook();
    const { data, fetchNextPage, hasNextPage, isFetching} = useEntitesHook();
    const {auth} = useAuth();

    const handleCreate = async (createData: TCreateDto) => {
        await createMutation.mutateAsync(createData)
    }

    const handleEdit = async (id: number, updateData: TUpdateDto) => {
        await updateMutation.mutateAsync({id, updateData});
    };

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const createDialogProps = {
        isOpen: isCreateDialogOpen,
        close: () => setIsCreateDialogOpen(false),
        createEntity: handleCreate
    };

    const [editEntityId, setEditEntityId] = useState<number>(-1);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const editDialogProps = {
        isOpen: isEditDialogOpen,
        close: () => setIsEditDialogOpen(false),
        editEntity: handleEdit,
        useEntityExtended: useEntityHook,
        targetEntityId: editEntityId,
    };

    const [detailEntityId, setDetailEntityId] = useState<number>(-1);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const detailDialogProps = {
        isOpen: isDetailDialogOpen,
        close: () => setIsDetailDialogOpen(false),
        useEntityExtended: useEntityHook,
        targetEntityId: detailEntityId,
    };

    const buttonColumns = [{
        field: 'detail',
        headerName: 'Detail',
        width: 150,
        renderCell: (params: GridRenderCellParams) => (
            <Button
                variant="contained"
                color="primary"
                onClick={() => {
                    setDetailEntityId((params.row as TDto).id)
                    setIsDetailDialogOpen(true);
                }}
            >
                Detail
            </Button>
        ),
    },
    {
        field: 'edit',
        headerName: 'Edit',
        width: 150,
        renderCell: (params: GridRenderCellParams) => (
            <Button
                disabled={auth?.role !== RoleValues.ADMIN}
                variant="contained"
                color="secondary"
                onClick={() => {
                    setEditEntityId((params.row as TDto).id);
                    setIsEditDialogOpen(true);
                }}
            >
                Edit
            </Button>
        ),
    },
    {
        field: 'delete',
        headerName: 'Delete',
        width: 150,
        renderCell: (params: GridRenderCellParams) => (
            <Button
                disabled={auth?.role !== RoleValues.ADMIN}
                variant="contained"
                color="error"
                onClick={() => deleteMutation.mutate((params.row as TDto).id)}
            >
                Delete
            </Button>
        ),
    }];

    const [paginationModel, setPaginationModel] = React.useState({
        page: 0,
        pageSize: GET_MANY_SIZE,
    });

    const rows = React.useMemo( () => {
        return data?.pages[paginationModel.page] ?? []
    }, [paginationModel, data])

    const totalRowCount = React.useMemo(() => {
        if (data?.pages) {
            return data.pages.flat().length;
        }
        return 0;
    }, [data, paginationModel.pageSize]);

    const handlePaginationModelChange = async (newPaginationModel: GridPaginationModel) => {
        if (data?.pages && data?.pages.length - 1 < newPaginationModel.page) {
            await fetchNextPage();
        }

        setPaginationModel(newPaginationModel);
    };

    const paginationMetaRef = React.useRef<GridPaginationMeta>();
    // Memoize to avoid flickering when the `hasNextPage` is `undefined` during refetch
    // paginationMeta = whether next page is available
    const paginationMeta = React.useMemo(() => {
        if (paginationMetaRef.current?.hasNextPage !== hasNextPage) {
            paginationMetaRef.current = { hasNextPage };
        }
        return paginationMetaRef.current;
    }, [hasNextPage]);

    const [rowCountState, setRowCountState] = React.useState(totalRowCount || 0);
    React.useEffect(() => {
        if (paginationMeta?.hasNextPage !== false) {
            setRowCountState(-1);
        }
    }, [paginationMeta?.hasNextPage, totalRowCount]);

    return (
        <>
            <Authorized role={RoleValues.ADMIN}>
                <Button startIcon={<AddCircleIcon />} variant="contained" color="primary" onClick={() => setIsCreateDialogOpen(true)} fullWidth sx={{mb: 2}}>
                    Add
                </Button>
            </Authorized>
            <DataGrid
                rows={rows}
                columns={columns.concat(buttonColumns)}
                paginationMode="server"
                rowCount={rowCountState}
                onRowCountChange={(newRowCount) => setRowCountState(newRowCount)}
                initialState={{ pagination: { rowCount: -1 } }}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationModelChange}
                paginationMeta={paginationMeta}
                pageSizeOptions={[GET_MANY_SIZE]}
                loading={isFetching}
                disableRowSelectionOnClick
            />

            <CreateDialogContext.Provider value={createDialogProps}>
                {createDialog}
            </CreateDialogContext.Provider>
            <EditDialogContext.Provider value={editDialogProps}>
                {editDialog}
            </EditDialogContext.Provider>
            <DetailDialogContext.Provider value={detailDialogProps}>
                {detailDialog}
            </DetailDialogContext.Provider>
        </>
    );
};

export default CursorPaginatedDataGrid;