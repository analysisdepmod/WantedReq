import { useQuery } from '@tanstack/react-query';
import axios from '../api';
import { IPersonSearch } from '../Interfaces/GeneralInterface';

export const usePersonSearch = (searchNo: number | null) => {
    return useQuery<IPersonSearch, Error>({
        queryKey: ['personSearch', searchNo],
        queryFn: async () => {
            const res = await axios.get(`/Account/Getperson/${searchNo}`);
            return res.data;
        },
        enabled: !!searchNo,
        staleTime:60*10*1000
    });
};
