/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { message } from "antd";
import { useMemo, useState} from "react";
import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import axios from "../api";
import {
  
    ApiResponse,
    TargetDto,
} from "../Interfaces/GeneralInterface";
import { AppDispatch } from "../../app/store";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { onCloseDialog } from "../../app/reducers/dialogSlice";
 
 
 
 
 
export const useTarget = () => {

    const dispatch = useDispatch<AppDispatch>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [flag, setFlag] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const ReactQueryKey = ["Targets", flag];

    const handleMutationResponse = (
        response: ApiResponse<string>,
        queryClient: QueryClient,
        queryKeys: (string | number)[][],
        onClose: () => void
    ) => {
        if (response.status) {
            message.success(response.message);
            queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
            onClose();
        } else {
            message.error(response.message);
        }
    };

    const defaultQueryKeys = [["Targets-counters"], ReactQueryKey];

    //#region Functions
            const onClose=()=> {
            dispatch(onCloseDialog());
          }
    //#endregion

    //#region Actions
    //   1. Fetch Targets
        const {
            data: TargetsData = [],
            isLoading,
            isError,
        } = useQuery<TargetDto[], Error>({
            queryKey: ReactQueryKey,
            queryFn: async () => {
                const res = await axios.get(`/Targets`);
                return res.data ?? [];
            }
        });

    //   2. Filter by search
    const filteredUsers = useMemo(() => {
        return TargetsData.filter((target) =>
            target.name.toString().includes(searchTerm) ||
            target.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) 
             
        );
    }, [TargetsData, searchTerm]);

     


     

   
    //   إنشاء هدف
    const {
        mutate: createTarget,
        isPending: isCreatingTarget
    } = useMutation<ApiResponse<string>, Error, TargetDto>({
        mutationFn: async (newTarget: TargetDto) => {
            const res = await axios.post("/Targets", newTarget);
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
        mutate: updateTarget,
        isPending: isUpdatingTarget
    } = useMutation<ApiResponse<string>, Error, TargetDto>({
        mutationFn: async (target: TargetDto) => {
            const res = await axios.put(`/Targets/${target.id}`, target);
            return res.data;
        },
        onSuccess: (response) =>
            handleMutationResponse(response, queryClient, defaultQueryKeys, onClose),
        onError: (error) => message.error({
            content: `❌ ${error.message}`, icon: null}),
        });

    //   حذف هدف
    const {
        mutate: deleteTarget,
        isPending: isDeletingUser
    } = useMutation<ApiResponse<string>, Error, number>({
        mutationFn: async (id: number) => {
            const res = await axios.delete(`/Targets/${id}`);
            return res.data;
        },
        onSuccess: (response) =>
            handleMutationResponse(response, queryClient, defaultQueryKeys, onClose),
        onError: (error) => message.error({
            content: `❌ ${error.message}`, icon: null
        }),
    
    });

    

    

 



    //#endregion
    const loding = isLoading || isCreatingTarget || isUpdatingTarget || isDeletingUser;
    return {
        dispatch,
        t,
        onClose,
        TargetsData: filteredUsers,
        loding,
        isError,
        setSearchTerm,
        setFlag,
        createTarget,
        isCreatingTarget,
        updateTarget,
        isUpdatingTarget,
        deleteTarget,
        isDeletingUser
  
    };
};
