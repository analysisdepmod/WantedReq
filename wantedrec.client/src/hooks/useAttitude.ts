/* eslint-disable @typescript-eslint/no-explicit-any */
import { message } from "antd";
import { useMemo, useState, useRef} from "react";
import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import axios from "../api";
import {
    ApiResponse,
    ViewspattudeDto,
    SpiAttitudeDtoview,
} from "../Interfaces/GeneralInterface";
import { AppDispatch } from "../../app/store";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { onCloseDialog } from "../../app/reducers/dialogSlice";
 
 
export const useAttitude = (year:number) => {

    const dispatch = useDispatch<AppDispatch>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    
    const [searchTerm, setSearchTerm] = useState<string>("");
    const ReactQueryKey = ["Attitude", year];
    
    const handleMutationResponse = (
        response: ApiResponse<string>,
        queryClient: QueryClient,
        queryKeys: (string | number)[][],
        onClose: () => void
    ) => {
        if (response.status) {
            message.success(response.message);
            queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
            queryClient.invalidateQueries({ queryKey: ['GetYearListattude', false] });
            onClose();
        } else {
            message.error(response.message);
        }
    };

    const defaultQueryKeys = [ [],ReactQueryKey];

    //#region Functions
            const onClose=()=> {
            dispatch(onCloseDialog());
          }
    //#endregion

    //#region Actions
    //   1. Fetch Attitude
     
    const {
        data: AttitudeData = [],
        isLoading
    } = useQuery<ViewspattudeDto[], Error>({
        queryKey: ReactQueryKey,
        queryFn: async () => {
            const res = await axios.get(`/SpiAttitudes?Nch=${true}&Nyear=${year}&Mujmal=${false}`);
          
            return res.data ?? [];
        },
        enabled: !!year,
        staleTime:0*60*1000
    });

    

    /*   2. Filter by search*/
    const filteredAttitude = useMemo(() => {
        const term = searchTerm.toLowerCase();

        return AttitudeData.filter((attude: ViewspattudeDto) => {
            const name = attude.targetName?.toString().toLowerCase() || '';
            const nameEn = attude.targetNameEn?.toLowerCase() || '';
            return name.includes(term) || nameEn.includes(term)  ;
        });
    }, [AttitudeData, searchTerm]);

    const {
        mutate: createAttitude,
        isPending: isCreatingAttitude
    } = useMutation<ApiResponse<string>, Error, SpiAttitudeDtoview>({
        mutationFn: async (attude: SpiAttitudeDtoview) => {
            const res = await axios.post("/SpiAttitudes", attude);
               return res.data;
           },
           onSuccess: (response) =>
               handleMutationResponse(response, queryClient, defaultQueryKeys, onClose),
           onError: (error) => message.error({
               content: `❌ ${error.message}`, icon: null
           }),
    });
   
    //   تعديل هدف
    const {
        mutate: updateAttitude,
        isPending: isUpdatingAttitude
    } = useMutation<ApiResponse<string>, Error, SpiAttitudeDtoview>({
        mutationFn: async (attude: SpiAttitudeDtoview) => {
          
            return axios.put(`/SpiAttitudes/${attude.id}`, attude)
                .then(res => res.data)
                .catch(e => console.log(e)) ;
         
        },
        onSuccess: (response) =>
            handleMutationResponse(response, queryClient, defaultQueryKeys, onClose),
        onError: (error) => message.error({
            content: `❌ ${error.message}`, icon: null}),
        });

    //   حذف هدف
    const {
        mutate: deleteAttitude,
        isPending: isDeletingAttitude
    } = useMutation<ApiResponse<string>, Error, number>({
        mutationFn: async (id: number) => {
            const res = await axios.delete(`/SpiAttitudes/DeleteSubSpiAttitude?id=${id}`);
            return res.data;
        },
        onSuccess: (response) =>
            handleMutationResponse(response, queryClient, defaultQueryKeys, onClose),
        onError: (error) => message.error({
            content: `❌ ${error.message}`, icon: null
        }),
    
    });


    const {
        mutate: actionTruthAttitude,
        isPending: isTruthAttitude
    } = useMutation<ApiResponse<string>, Error, SpiAttitudeDtoview>({
        mutationFn: async (value: SpiAttitudeDtoview) => {
            const res = await axios.post(`/SpiAttitudes/Truth`, { Id:  value.idSub   });
            return res.data;

        },
        onSuccess: (response) =>
            handleMutationResponse(response, queryClient, defaultQueryKeys, onClose),
        onError: (error) =>
            message.error({
                content: `❌ ${error.message}`,
                icon: null
            }),
    });




    const handleUpdateUser = (spi: SpiAttitudeDtoview) => {
        updateAttitude(spi);
      
    };

    const formRef = useRef<{ submit: () => void }>(null);

    //#endregion
    const loading = isLoading || isCreatingAttitude || isUpdatingAttitude || isDeletingAttitude || isTruthAttitude;
    return {
        dispatch,
        t,
        onClose,
        AttitudeData:  filteredAttitude,
        loading,
        setSearchTerm,
        createAttitude,
        updateAttitude,
        deleteAttitude,
        handleUpdateUser,
        formRef,
        actionTruthAttitude
      };
};
