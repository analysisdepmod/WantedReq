/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { message } from "antd";
import { useMemo, useState, useEffect} from "react";
import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import axios from "../api";
import {
    User,
    AddUser, 
    IUsersCounters,
    UsersCardData,
    ApiResponse,
} from "../Interfaces/GeneralInterface";
import { AppDispatch } from "../../app/store";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { onCloseDialog } from "../../app/reducers/dialogSlice";
import { closedAccountFlag, CreateLevel } from "../Interfaces/varaibles";
import { mapApiToCards } from "../Interfaces/functions";
 
 
 
export const useUsers = () => {

    const dispatch = useDispatch<AppDispatch>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [flag, setFlag] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const ReactQueryKey = ["users", flag];

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

    const defaultQueryKeys = [["users-counters"], ReactQueryKey];

    //#region Functions
            const onClose=()=> {
            dispatch(onCloseDialog());
          }
    //#endregion

    //#region Actions
    //   1. Fetch users
        const {
            data: usersData = [],
            isLoading,
            isError,
        } = useQuery<User[], Error>({
            queryKey: ReactQueryKey,
            queryFn: async () => {
                const res = await axios.get(`account/GetAllUser?flag=${flag}`);
                return res.data ?? [];
            }
        });

    //   2. Filter by search
    const filteredUsers = useMemo(() => {
        return usersData.filter((user) =>
            user.personNo.toString().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.originalUintUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.created_by.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [usersData, searchTerm]);

    //   3. Fetch counters
    const {
        data: countersRaw = [],
        isLoading: isCountersLoading,
        isError: isCountersError,
    } = useQuery<IUsersCounters[], Error>({
        queryKey: ["users-counters"],
        queryFn: async () => {
            const res = await axios.get(`account/GetAllCounters`);
            return res.data;
        }
    });


    const [usersCounters, setUsersCounters] = useState<UsersCardData[]>();

    useEffect(() => {
        if (countersRaw && countersRaw.length > 0) {
            setUsersCounters(mapApiToCards(countersRaw));
        }
    }, [countersRaw]);

   
    //   إنشاء مستخدم
    const {
        mutate: createUser,
        isPending: isCreatingUser
       } = useMutation<ApiResponse<string>, Error, AddUser>({
           mutationFn: async (newUser: AddUser) => {
               const res = await axios.post("/Account", newUser);
               return res.data;
           },
           onSuccess: (response) =>
               handleMutationResponse(response, queryClient, defaultQueryKeys, onClose),
           onError: (error) => message.error({
               content: `❌ ${error.message}`, icon: null
           }),
    });
   
    //   تعديل مستخدم
    const {
        mutate: updateUser,
        isPending: isUpdatingUser
    } = useMutation<ApiResponse<string>, Error, AddUser>({
        mutationFn: async (user: AddUser) => {
            const res = await axios.put(`/Account/${user.id}`, user);
            return res.data;
        },
        onSuccess: (response) =>
            handleMutationResponse(response, queryClient, defaultQueryKeys, onClose),
        onError: (error) => message.error({
            content: `❌ ${error.message}`, icon: null}),
        });

    //   حذف مستخدم
    const {
        mutate: deleteUser,
        isPending: isDeletingUser
    } = useMutation<ApiResponse<string>, Error, string>({
        mutationFn: async (id: string) => {
            const res = await axios.delete(`/Account/${id}`);
            return res.data;
        },
        onSuccess: (response) =>
            handleMutationResponse(response, queryClient, defaultQueryKeys, onClose),
        onError: (error) => message.error({
            content: `❌ ${error.message}`, icon: null
        }),
    
    });

    const {
        mutate: toggleAccountStatus,
        isPending: isTogglingStatus
    } = useMutation<ApiResponse<string>, Error, { id: string, isActive: boolean }>({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        mutationFn: async ({ id }) => {
            const res = await axios.post(`/Account/LockInOut/${id}`);
            return res.data;
        },
        onSuccess: (response) =>
            handleMutationResponse(response, queryClient, defaultQueryKeys, onClose),
        onError: (error) =>
            message.error({ content: `❌ ${error.message}`, icon: null }),
    });

    const {
        mutate: resetPassword,
        isPending: isResettingPassword
    } = useMutation<ApiResponse<string>, Error, string>({
        mutationFn: async (id) => {
            const res = await axios.post(`/Account/ResetPassword/${id}`);
            return res.data;
        },
        onSuccess: (response) =>
            handleMutationResponse(response, queryClient, defaultQueryKeys, onClose),
        onError: (error) =>
            message.error({ content: `❌ ${error.message}`, icon: null }),
    });

 



    //#endregion
    const loading = isLoading || isCreatingUser || isUpdatingUser || isDeletingUser || isCountersLoading || isResettingPassword || isTogglingStatus;
    return {
        dispatch,
        t,
        CreateLevel,
        closedAccountFlag,
        onClose,
        users: filteredUsers,
        loading,
        isError,
        setSearchTerm,
        setFlag,
        usersCounters,
        isCountersError,
        createUser,
        updateUser,
        deleteUser,
        toggleAccountStatus,
        resetPassword,
  
    };
};
