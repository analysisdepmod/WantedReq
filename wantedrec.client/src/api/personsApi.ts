import axios from '../api'
import type {
    ApiResponse,
    PersonDetailDto,
    PersonListItemDto,
    PersonUpsertDto,
    PersonFaceImageDto,
    RecognitionResultDto,
} from '../types/person.types';

export const getPersons = async (params?: {
    search?: string;
    isActive?: boolean;
    isDeleted?: boolean;
})    => {
    const res = await axios.get('/persons', { params });
    return res.data.data;
};

export const getPersonById = async (id: number): Promise<PersonDetailDto> => {
    const res = await axios.get<ApiResponse<PersonDetailDto>>(`/persons/${id}`);
    return res.data.data;
};

export const createPerson = async (dto: PersonUpsertDto): Promise<PersonDetailDto> => {
    const res = await axios.post<ApiResponse<PersonDetailDto>>('/persons', dto);
    return res.data.data;
};

export const updatePerson = async (
    id: number,
    dto: PersonUpsertDto,
): Promise<PersonDetailDto> => {
    const res = await axios.put<ApiResponse<PersonDetailDto>>(`/persons/${id}`, dto);
    return res.data.data;
};

export const deletePerson = async (id: number): Promise<void> => {
    await axios.delete(`/persons/${id}`);
};

export const getPersonFaceImages = async (id: number): Promise<PersonFaceImageDto[]> => {
    const res = await axios.get<ApiResponse<PersonFaceImageDto[]>>(
        `/persons/${id}/face-images`,
    );
    return res.data.data;
};


export const setActive = async (
    id: number,
    
): Promise<boolean> => {
    const res = await axios.put<ApiResponse<boolean>>(`/persons/${id}/activate`);
    console.log(res.data)
    return res.data.data;
};

export const setDisActive = async (
    id: number,

): Promise<boolean> => {
    const res = await axios.put<ApiResponse<boolean>>(`/persons/${id}/deactivate`);
    return res.data.data;
};





// في نهاية personsApi.ts
export const identifyFace = async (file: File): Promise<RecognitionResultDto> => {
    const form = new FormData();
    form.append('file', file, file.name || 'capture.jpg');
    const res = await axios.post<ApiResponse<RecognitionResultDto>>(
        '/recognition/identify',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data.data;
};