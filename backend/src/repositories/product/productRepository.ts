import {Result} from "@badrap/result";
import prisma from "../client";
import {DbResult} from "../types";
import {handleRepositoryErrors, READ_MANY_TAKE} from "../../utils/repositoryUtils";
import {ProductCreateDto, ProductDto, ProductExtendedDto, ProductFilters, ProductUpdateDto} from "./types";
import {productModelToProductDto, productModelToProductExtendedDto} from "./mappers";
import {Prisma} from "@prisma/client";
import { ConflictError } from "../../errors/errors";

const productRepository = {
    async create(data: ProductCreateDto): DbResult<ProductDto> {
        try {
            const product = await prisma.product.create({
                data: {
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    type: data.type,
                    categories: {
                        connect: data.categoryIds.map(id => ({id}))
                    }
                },
                include: {
                    categories: true,
                }
            });
            return Result.ok(productModelToProductDto(product))
        } catch (error) {
            return handleRepositoryErrors(error);
        }
    },

    async read(id: number): DbResult<ProductExtendedDto> {
        try {
            const product = await prisma.product.findUniqueOrThrow({
                where: {
                    id,
                },
                include: {
                    categories: true,
                },
            });
            return Result.ok(productModelToProductExtendedDto(product));
        } catch (error) {
            return handleRepositoryErrors(error);
        }
    },

    async readMany(cursorId: number | undefined, filterValues: ProductFilters): DbResult<ProductExtendedDto[]> {
        const filter: Prisma.ProductWhereInput = {
            AND: [
                {id: {equals: filterValues.id}},
                {name: {contains: filterValues.name, mode: 'insensitive'}},
                {description: {contains: filterValues.description, mode: 'insensitive'}},
                {type: {equals: filterValues.type}},
                {price: {gte: filterValues.minPrice}},
                {price: {lte: filterValues.maxPrice}},
                {categories: {some: {id: {in: filterValues.categoryIds}}}},
            ],
        }

        try {
            if (!cursorId) {
                const products = await prisma.product.findMany({
                    take: READ_MANY_TAKE,
                    orderBy: {id: 'asc'},
                    where: filter,
                    include: {
                        categories: true,
                    },
                });
                return Result.ok(products.map(product => productModelToProductExtendedDto(product)));
            }
            const products = await prisma.product.findMany({
                skip: 1,
                cursor: {id: cursorId},
                take: READ_MANY_TAKE,
                orderBy: {id: 'asc'},
                where: filter,
                include: {
                    categories: true,
                },
            });
            return Result.ok(products.map(product => productModelToProductExtendedDto(product)));
        } catch (error) {
            return handleRepositoryErrors(error);
        }
    },

    async update(id: number, data: ProductUpdateDto): DbResult<ProductDto> {
        try {
            const product = await prisma.product.update({
                where: {
                    id: id,
                },
                data: {
                    name: data.name,
                    type: data.type,
                    price: data.price,
                    description: data.description,
                    categories: {
                        set: data.categoryIds ? data.categoryIds.map((id) => ({id})) : undefined,
                    },
                },
                include: {
                    categories: true,
                },
            });
            return Result.ok(productModelToProductDto(product));
        } catch (error) {
            return handleRepositoryErrors(error);
        }
    },

    async delete(id: number): DbResult<ProductDto> {
        try {
            const transactionResult = await prisma.$transaction(
                async (transaction) => {
                    const product = await transaction.product.findUniqueOrThrow({
                        where: {
                            id,
                        },
                        include: {
                            offerToProducts: true,
                        },
                    });
                    if (product.offerToProducts.length != 0) {
                        throw new ConflictError("Cannot delete product as it is used by some offers");
                    }
                    const deletedProduct = await transaction.product.delete({
                        where: {id},
                        include: {
                            categories: true
                        }
                    });
                    return deletedProduct;
                }
            )
            return Result.ok(productModelToProductDto(transactionResult));
        } catch (error) {
            return handleRepositoryErrors(error);
        }
    },
}

export default productRepository;
