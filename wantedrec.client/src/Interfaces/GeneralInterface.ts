import { TablePaginationConfig } from "antd";
import { LocaleComponentName } from "antd/es/locale/useLocale";
import { FilterValue } from "antd/es/table/interface";
import { JSX } from "react";
 
 
export interface User {
    key: React.Key;
    id: string;
    email: string;
    ur_no: number;
    unitName: string;
    personNo: bigint;
    personName: string;
    personPosition: string;
    lastLogin: Date;
    passChange: boolean;
    loginTimes: number,
    rankId: number;
    rankName: string;
    cisco: bigint;
    created_date: Date;
    created_by: string;
    updated_date: Date;
    updated_by: string;
    seenUpdate: boolean;
    passChangeDate: Date;
    closedAccountFlag: number;
    closedAccountNotc: string;
    closedDate: Date;
    lockoutEnabled:boolean,
    closedBy: string;
    hrTest: boolean;
    roleWithUserDto: Role[];
    unitUser: number[];
    originalUintUser: number;
    originalUintUserName: string;
    lastOriginalUintUser: number;
    lastOriginalUintUserName: string;
    
    createLevel: number;
}
export interface AddUser {
    id: string;
    email: string;
    ur_no: number;
    originalUintUser: number;
    personNo: bigint;
    personName: string;
    personPosition: string;
    rankId: number;
    cisco: bigint;
    hrTest: boolean;
    roleWithUserDto: Role[];
    unitUser: number[];
    createLevel: number;
    
}
export interface IUsersCounters {
    id: number,
    counter: number,
    isSummary: boolean
}
export interface ApiResponse<T> {
    status: boolean;
    message: string;
    data?: T;
}
export interface UsersCardData {
    id: number;
    title: string;
    icon?: JSX.Element;
    count?: number;
    isSummary?: boolean;
    data?: {
        label: string;
        value: string | number;
        icon: JSX.Element;
    }[];
}
export interface Role {
    roleId: string;
    roleName: string;
    roleNameAR: string;
    isSelected: boolean;
}

 
export interface IRules {
    allowedRules: string[];
}
 
export interface LoginDto {
    email: string;
    password: string;
    rememberMe: boolean;
} 
export interface resetPass {
  
    token:string,
newPassword: string;
confirmPassword: string;
}
export interface RegisterUserDto {
    email: string;
    password: string;
    personName: boolean;
}
export interface ILoginResponse {
    token: string;
    expiration: Date,
    refresh_token: string,
    refresh_token_expiry: Date,
    message: string,
    loginStatus: boolean,
    passwordChange: boolean,
    userRoles: string[];
    basicUserInfo: IbasicUserInfo,
    accessFailedCount: number
}
export interface IbasicUserInfo {
    userName: string;
    unitName: string,
    rankName: string,
    userid: string,


}
 
export interface IAuth {
    loginResponse: ILoginResponse;
    loading: boolean;
    messegeError:string

}
export interface TableParams {
    pagination?: TablePaginationConfig;
    sortField?: string;
    sortOrder?: string;
    filters?: Record<string, FilterValue>;
}
export interface ModalState {
    isOpen: boolean,
    postState: boolean,
    Width: number,
    title: string,
    content: LocaleComponentName,
    modalIcon: LocaleComponentName,
    loading: boolean,
    
}
 
 

export interface SpiUnitDTO {
    id: number,
    id1: number,
    ur_no: number,
    sort: number,
    active: boolean,
    color: string,
    bgColor: string,
    canAdd: boolean,
    name: string | null,
    nameEn: string | null,
 
}

export interface SubMangeMinistrysDto {
   
   
    id: number,
 
    name: string,
    nameEn: string,
    position: string,
    positionEn: string,
     
    rankName: string | null,
    ruleOfficerMinistryId:number,
    ruleOfficerMinistryName:string,
    ruleOfficerMinistryNameEn:string,
    rankId: number,
    from: Date,
    to: Date,
    sort: number,
    active: boolean,
    
}
export interface IChart {
    
    id: number,
    year: number,
    userGain: number,
    userLost: number,
}
export interface IChartDataSet {

    labels: number[],
    datasets: IcData[],
   
}
export interface IcData {

    label: string,
    data: number[],
    backgroundColor: string[],
    borderColor:string,
    borderWidth:number

}   
export interface TargetDto  {
 
    id: number,
    pid: number,
    name: string ,
    nameEn: string ,
    sort: number,
    active: boolean,
    moshtrak: boolean,
    year: number,
    mainTarget: boolean,
    perentTargetId: number |null,
    targetScorr: number,
    subTargets: TargetDto[] 

}
export interface TargetScorrDto {
        mainTargetScorr :number,
            sumSubTargetScorr :number
    }
export interface Images{
 
    id: number,
    image: File|null,
    imageFileName: string|null,
    userId: string,
    userName: string,
    unitName:string,
    name: string,
    sort: number,
    description: string,
    descriptionEn: string,
    createdDate :Date,
    color: string,

 
}
export interface ImagesDto {

    id: number,
    image: File | null,
    userId: string,
     userName: string,
     unitName: string,
    createdDate: Date,
    name: string,
    nameEn: string,
    sort: number,
    description: string,
    descriptionEn: string,
    color: string,
 

    


}
export interface SpniPdf{
    id1: number,
    id: number,
    name: string,
    nameEn: string,
    pdfFileName: string,
    pdf: File | null,
    sort: number,
    description: string
    descriptionEn: string
    color:string,
}
export interface SpniPdfDto{
    
    id: number,
    name: string,
    nameEn: string,
    pdfFileName: string,
    pdf:string,
    sort: number,
    description: string
    descriptionEn: string
    color:string,
}

export interface OfficerInfoDto {
 
    id: number,
    name: string,
    nameEn: string,
    position: string,
    positionEn: string,
    sort: number,
    countryName: string | null,
    countryNameEn: string | null,
    active:boolean,
    rankName: string | null,
    rankNameEn: string | null,
     countryId: number,
     rankId: number,
    from: Date,
    ruleOfficerMinistryId:number,
    ruleOfficerMinistryName:string,
    ruleOfficerMinistryNameEn:string,
     to: Date,
}

export interface RankList {
     label: string,
    labelEn: string,
    value: number,
}
export interface CountryList {
    label: string,
    labelEn: string,
    value: number,
}
export interface OfficerInfoDtoSp {
    ranks: RankList[],
    country: CountryList[],
    rule: RuleList[],
    record: OfficerInfoDto
}
export interface SubMangeMinistryDtoSp  {
    ranks: RankList[],
    rule: RuleList[],
    record: SubMangeMinistrysDto

}
export interface RuleList {
    value: number,
    label: string,
    labelEn: string,
}
export interface SpiUnitAutoComplete {
    key: number,
   value : number,
}
 
export interface SpiUnitSp {
    units: SpiUnitAutoComplete[],
    record: SpiUnitDTO
}
 

export interface SpiAttitudeDto {
    id1: number,
    pid: number,
    pName: string|null,
    id: number,
    targetId: number,
    officerInfoId: number,
    manageMinistryId: number,
    targetName: string,
    targetNameEn:string,
    officerName: string,
    officerNameEn: string,
    manageMinistryName: string,
    manageMinistryNameEn: string,
    follow: string,
    followEn: string,
    actionTaken: string,
    actionTakenEn: string,
    suggistion: string,
    suggistionEn: string,
    resolution: string,
    resolutionEn: string,
    targetType:boolean,
    year:number,
    isTrue:boolean
    mujmal: boolean
    startDateToComplete: Date,
    endDateToComplete: Date,
    targetScorr: number,
    rateComplete:number,
    isComplete :boolean,
    endNotComplete: boolean,
    targetSort: number,
    subSpiAttitude: SpiAttitudeDto[],
    canEdit: boolean,
    spiAttitudeId: number,
    hasHastery: boolean,
    idSub: number,
    sort: number,

    isDeletedSpi: boolean,
    isDeletedSub: boolean,
}
 
export interface TargetList {
    label: string,
    labelEn: string,
    value: number,
    
}
export interface OfficerList {
    label: string,
    labelEn: string,
    value: number,
}
export interface ManageMinistryList {
    label: string,
    labelEn: string,
    value: number,
    
}

export interface YearList {
    label: string,
    labelEn: string,
    value: number,
}
export interface Yearss {
    year: number,
}

export interface SpiAttitudeDtoSp {
 
     
    
    record: SpiAttitudeDto
}
export interface NewsDto {
    id1: number;
    id: number;
    applicationUserId: string; 
    details: string; 
    detailsEn: string; 
    can: boolean;
    canAll: boolean;
}
export interface TargetsMangeMinistryDto {
    id: number,
    mangeMinistryId: number,
    mangeMinistryName:string,
    mangeMinistryNameEn:string,
    targetsMangeMinistryList: TargetsListDto[];
    targetsList: number[];
}
export interface TargetsListDto {
    label: string,
    labelEn: string,
    value: number,
    sort:number,

}
export interface ITransilation {
    text: string | null,
    sl: string | "ar",
    tl:string|"en"
}
export const TransInitailValue: ITransilation = {
    text: "",
    sl:  "ar",
    tl:  "en"
}
export interface HRPerson {

    ur_no: number; 
    unitName: string;
    originalUnitUsere: string;
    personNo: bigint;
    personName: string;
    personPosition: string;
    rankId: number; 
    rankName: string;
}


export interface SubSpniAttudeDto {
    follow: string,
    followEn: string,
    actionTaken: string,
    actionTakenEn: string,
    suggistion: string,
    suggistionEn: string ,
    resolution: string,
    resolutionEn: string,
    day: number,
    month: number,
    year: number,
    fullDate: Date,
    note: Date,
    isTrue: boolean,
    mujmal: boolean
    isComplete: boolean,
    endNotComplete: boolean 
    startDateToComplete: Date
    endDateToComplete: Date
    rateComplete: number

   officerName: string
    officerNameEn: string
}
export interface SPAttuideHistory
{
    targetId: number;
    targetName: string;
    targetNameEn: string;
    manageMinistryId: number;
    manageMinistryName: string;
    manageMinistryNameEn: string;
    subSpAttuideYears: SubSpAttuideYear[];


}

export interface SubSpAttuideYear
{
    year: number;
    subSpniAttudeDtos: subSpniAttudeDtos[];
}

export interface subSpniAttudeDtos
{
    id: number,
    follow: string,
    followEn: string,
    actionTaken : string,
    actionTakenEn: string,
    suggistion: string,
    suggistionEn: string,
    resolution: string,
    resolutionEn: string,
    day : number,
    month : number,
    year : number,
    fullDate: string,
    note: string,
    isTrue: boolean,
    mujmal: boolean,
    isComplete: boolean,
    endNotComplete: boolean,
    startDateToComplete:string,
    endDateToComplete: string,
    officerInfoId: number,
    officerInfo: string,
    canEdite: boolean,
    spiAttitudeId: number,
    spiAttitude: string,
    rateComplete: number,
    officerName: string,
    officerNameEn: string, 
}

export interface accountStatistics {
    activitAcount: number,
    closedAccounts: number,
    notLogged: number,
    notChangePassword: number,
    allUsers: number,
    loginTimes: number

}
export interface ResponseStatus {
    message: string;
    success: boolean;
    statusCode: number;
}
export interface SelectList {
    value: number,
    label: string,
}

export interface SpiAttitudeDtoview {
    id1: number,
    id: number,
    idSub: number,
    spiAttitudeId: number,
    targetId: number,
    targetName: string;
    targetNameEn: string;
    targetSort: number,
    targetScorr: number,
    officerInfoId: number,
    officerName: string,
    officerNameEn: string,
    manageMinistryId: number,
    manageMinistryName: string,
    manageMinistryNameEn: string,
    actionTaken: string,
    actionTakenEn: string,
    follow: string,
    followEn: string,
    resolution: string,
    resolutionEn: string,
    suggistion: string,
    suggistionEn: string,
    year: number,
    targetType: boolean,
    isTrue: boolean
    endDateToComplete: Date,
    startDateToComplete: Date,
    endNotComplete: boolean,
    isComplete: boolean,
    rateComplete: number,
    canEdit: boolean,
    hasHastery: boolean,
    isDeletedSpi: boolean,
    isDeletedSub: boolean,
    fullDate: Date,
}

export interface ViewspattudeDto {
    targetId: number;
    pid: number;
    targetName: string;
    targetNameEn: string;
    IsDeletedSpi: boolean; 
    sort: number;
    spiAttitudeDtos: SpiAttitudeDtoview[];
    RowSpan: number;
 
}

export interface IDialogProps {
    dialogIcon: JSX.Element | string,
    content: JSX.Element | string,
    title: string,
    isOpen: boolean,
    postState: boolean,
    loading: boolean,
    width: number,
    height: number,
}
export interface IPersonSearch {
    name: string;
    position: string;
    rankId: number;
    orginalUserUnit: number;
    
}



export interface ManageMinistryListtoltap {
       label: string  
       labelEn:string 
       value  :number
    targetsLists: TargetsListtoltap[],
}
export interface TargetsListtoltap {
     label :string  
     labelEn :string 
     value:number

}
export interface setting {
    numberWord:number

}