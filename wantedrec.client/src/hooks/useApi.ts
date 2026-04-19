// useGenApi.js
import {  useQuery } from '@tanstack/react-query'
import axios from "../../src/api";
import { useMemo } from 'react';
import { Images, ManageMinistryList, NewsDto, OfficerList,  SPAttuideHistory, SubSpniAttudeDto, TargetList, YearList } from '../Interfaces/GeneralInterface';
 

export const useAllPerUnits = (year: number, arlang:boolean) => {
    
    const queryKey = useMemo(
        () => ['AllPerUnits', year, arlang],
        [year, arlang]
    );
    const query = useQuery<ManageMinistryList[], Error>({
        queryKey,
        queryFn: async () => {
            const res = await axios.get(`/SpiAttitudes/PerUnits`, {
                params: { Year: year }

            });
            return arlang ? res.data
                : res.data.map((i: ManageMinistryList) => {
                    return {
                        label: i.labelEn,
                        value: i.value
                    } as ManageMinistryList
                }); 
             
        },
        enabled: !!year,  
        refetchOnWindowFocus: false,  
        staleTime: 0 * 60 * 1000,
    });

    return {
        dataPerUnits: query.data || [] as ManageMinistryList[],
        isLoadingPerUnits: query.isLoading,
        isErrorPerUnits: query.isError,
        refetchPerUnits: query.refetch,
    };
};

export const useAllPerTargets = (year: number, arlang: boolean) => {

    const queryKey = useMemo(
        () => ['AllPerTargets', year, arlang],
        [year, arlang]
    );
    const query = useQuery<TargetList[], Error>({
        queryKey,
        queryFn: async () => {
            const res = await axios.get(`/SpiAttitudes/AllPerTargets`, {
                params: { Year: year }

            });
            return arlang ? res.data
                : res.data.map((i: TargetList) => {
                    return {
                        label: i.labelEn,
                        value: i.value
                    } as TargetList
                });

        },
        enabled: !!year,
        refetchOnWindowFocus: false,
        staleTime: 0 * 60 * 1000,
    });

    return {
        dataPerTargets: query.data || [] as TargetList[],
        isLoadingPerTargets: query.isLoading,
        isErrorPerTargets: query.isError,
        refetchPerTargets: query.refetch,
    };
};
const fetchAutoComplete = async () => {
    const res = await axios.get('/Account/GetAutoComplete');
    return res.data;
}

const fetchAllRanks = async () => {
    const res = await axios.get('/Account/GetAllRanks')
    return res.data;
}
const fetchMangeMinstry = async () => {
    const res = await axios.get('account/GetManageMinistryList')
    return res.data;
}

const fetchRoles = async (userId: string) => {
    const res = await axios.get(`/Account/GetAllRole?userid=${userId}`);
    return res.data;
}
export const useMangeMinstry = () => {
    return useQuery({
        queryKey: ['fetchMangeMinstry'],
        queryFn: fetchMangeMinstry,
        staleTime: 60 * 60 * 1000,
    })
}
export const useAutoComplete = () => {
    return useQuery({
        queryKey: ['autoComplete'],
        queryFn: fetchAutoComplete,
        staleTime: 60 * 60 * 1000,
    })
}
export const useAutoCompleteorgunits = () => {
    const {
        data: orgUnits,
        isLoading: loadingOrgUnits,
        isError: errorOrgUnits,
    } = useQuery({
        queryKey: ['autoCompleteorgunits'],
        queryFn: async () => {
            const res = await axios.get('/Account/GetAutoCompleteorgunits')
            return res.data ?? [];
        },
        staleTime: 0 * 60 * 1000,
    });

    return {
        orgUnits,
        loadingOrgUnits,
        errorOrgUnits
    }
}

export const useAllRanks = () => {
    return useQuery({
        queryKey: ['allRanks'],
        queryFn: fetchAllRanks,
        staleTime: 60 * 60 * 1000,
    })
}

export const useUserRoles = (userId: string) => {
    return useQuery({
        queryKey: ['userRoles', userId],
        queryFn: () => fetchRoles(userId),
        //enabled: !!userId, 
        staleTime: 0 * 60,
    })
}

 
export const useNews = () => {
    return useQuery<NewsDto[], Error>({
        queryKey: ['allNews'],
        queryFn: async () => {
            const res = await axios.get(`/home/GetAllNews`);
            return res.data;
        },
        staleTime: 1 * 60 * 1000,
    });
};

export const useImage = () => {
    return useQuery<Images[], Error>({
        queryKey: ['allImage'],
        queryFn: async () => {
            const res = await axios.get(`/home/getImages`);
            return res.data;
        },
        staleTime: 1 * 60 * 1000,
    });
};


export const useYears = () => {
    return useQuery<YearList[], Error>({
        queryKey: ['allYears'],
        queryFn: async () => {
            const res = await axios.get(`SpiAttitudes/GetYearAllList`);
            return res.data;
        },
        staleTime: 1 * 60 * 1000,
    });
};

export const useTargetMain = () => {
    return useQuery<TargetList[], Error>({
        queryKey: ['allTargetMain'],
        queryFn: async () => {
            const res = await axios.get(`Targets/GetTargetMain`);
            return res.data;
        },
        staleTime: 1 * 60 * 1000,
    });
};



export const useOfficerList = (arlang: boolean) => {
    return useQuery<OfficerList[], Error>({
        queryKey: ['allOfficerList', arlang],
        queryFn: async () => {
            const res = await axios.get(`SpiAttitudes/GetOfficerList`);
            return arlang ? res.data :
                res.data.map((i: TargetList) => {
                    return {
                        label: i.labelEn,
                        value: i.value
                    } as TargetList
                });

        },
        staleTime: 1 * 60 * 1000,
    });
};
export const useManageMinistryList = (flag: boolean, arlang: boolean) => {
    return useQuery({
        queryKey: ['ManageMinistryList', flag, arlang],
        queryFn: async () => {
            const res = await axios.get(`SpiAttitudes/GetManageMinistryListWithUser?flag=${flag}`);
            return arlang ? res.data :
                res.data.map((i: TargetList) => {
                    return {
                        label: i.labelEn,
                        value: i.value
                    } as TargetList
                });
        },
        staleTime: 1 * 60 * 1000,


    })
}


export const useIdSpAttuide = (Tid: number, year: number, Tmind:number) => {
    return useQuery({
        queryKey: ['IdSpAttuide', Tid, year, Tmind],
        queryFn: async () => {
            const res = await axios.get(`SpiAttitudes/GetIdSpniAttude?TargetId=${Tid}&Year=${year}&ManageMinistryId=${Tmind}`);
            return res.data;
        },
        staleTime: 1 * 60 * 1000,


    })
}


export const useGetYearList = (flag: boolean, Tmind: number) => {
    return useQuery({
        queryKey: ['YearList', flag, Tmind],
        queryFn: async () => {
            const res = await axios.get(`SpiAttitudes/GetYearAllList?flag=${flag}&minid=${Tmind}`);
            return res.data;
        },
        staleTime: 1 * 60 * 1000,

    })
}

export const useGetYearListattude = (ch: boolean) => {
    return useQuery({
        queryKey: ['GetYearListattude', ch],
        queryFn: async () => {
            const res = await axios.get(`SpiAttitudes/GetYearList?Nch=${ch}`);
            return res.data;
        },
        staleTime: 1 * 60 * 1000,
    })
}



export const usesubAttuide = (
    targetId: string | undefined,
    manageMinistryId: string | undefined
) => {
    return useQuery<SPAttuideHistory>({
        queryKey: ['subAttuideHistery', targetId, manageMinistryId],
        queryFn: async () => {
            const res = await axios.get(
                `/SpiAttitudes/GetListfromsub?tirgetid=${targetId}&minid=${manageMinistryId}`
            );
            return res.data;
        },
        staleTime: 1 * 60 * 1000,
        enabled: !!targetId && !!manageMinistryId, // ßáÇ ÇáŞíãÊíä íÌÈ Ãä Êßæä ÕÍíÍÉ
    });
};


export const useTargetAddList = (Nyear: number, MinistaryId: number, edit: boolean, arlang: boolean, tg: boolean, flag: boolean) => {
    return useQuery({
        queryKey: ['TargetAddList', flag, arlang, Nyear, MinistaryId, tg],
        queryFn: async () => {
            const res = await axios.get(`SpiAttitudes/GetTargetList?MinistaryId=${MinistaryId}&Nyear=${Nyear}&edit=${edit}&typeTagret=${tg}&flag=${flag}`);
            return arlang ? res.data :
                res.data.map((i: TargetList) => {
                    return {
                        label: i.labelEn,
                        value: i.value
                    } as TargetList
                });
        },
        staleTime: 1 * 60 * 1000,


    });
 

};

export const useGetDetalsub = (
    targetId: number | undefined,
    ministryId: number | undefined ,
    year: number | undefined
) => {
    return useQuery<SubSpniAttudeDto >({
        queryKey: ['GetDetalsub', targetId, ministryId, year],
        queryFn: async () => {
            const res = await axios.get(
                `SpiAttitudes/GetDetalsub?targetId=${targetId}&ministryId=${ministryId}&year=${year}`
            );
            return res.data;
        },
        staleTime: 1 * 60 * 1000,
        enabled: !!targetId && !!ministryId&&!!year// ßáÇ ÇáŞíãÊíä íÌÈ Ãä Êßæä ÕÍíÍÉ
    });
};