import { BaseModelId } from "../types";

export type CategoryDto = BaseModelId & {
    name:                string
}

export type CategoryCreateDto = Omit<CategoryDto, "id">;
export type CategoryUpdateDto = Partial<CategoryDto>;

export type CategoryFilters = Partial<CategoryDto>;