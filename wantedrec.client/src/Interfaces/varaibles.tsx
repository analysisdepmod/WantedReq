import {
    CheckCircleFilled,
    CloseCircleFilled,
    LockFilled,
    InfoCircleFilled,
    ClockCircleFilled,
    WarningFilled
} from "@ant-design/icons";
import { JSX } from "react"; 
import { SelectList } from "./GeneralInterface";

export const iconMap: Record<number, JSX.Element> = {
    0: <CheckCircleFilled style={{ fontSize: 28, color: "green" }} />,
    1: <CloseCircleFilled style={{ fontSize: 28, color: "red" }} />,
    4: <ClockCircleFilled style={{ fontSize: 28, color: "orange" }} />,
    5: <InfoCircleFilled style={{ fontSize: 28, color: "blue" }} />,
    6: <LockFilled style={{ fontSize: 28, color: "gray" }} />,
    100: <CheckCircleFilled style={{ fontSize: 28, color: "cyan" }} />,
    101: <WarningFilled style={{ fontSize: 28, color: "gold" }} />,
};

export const titleMap: Record<number, string> = {
    0: "الحسابات النشطة",
    1: "الحسابات المعطلة",
    4: "لم يسجلوا الدخول منذ فترة",
    5: "لم يغيروا كلمة المرور منذ فترة",
    6: "معطلين إداريًا لأسباب مختلفة",
    100: "المستخدمين الكلي",
    101: "إجمالي مرات الدخول",
};

export const CreateLevel = [
    { value: 0, label: "-- يرجى الاختيار --" },
    { value: 1, label: "الوحدة نفسها" },
    { value: 2, label: "عمق واحد من الوحدات" },
    { value: 3, label: "عمقين من الوحدات" },
    { value: 4, label: "كافة وحدات العمق" },
] as SelectList[];

export const closedAccountFlag = [
    { value: 0, label: "مفعل" },
    { value: 1, label: "معطل بسبب تسجيل الدخول غير الصحيح" },
    { value: 2, label: "معطل من قبل مديرتنا" },
    { value: 3, label: " معطل بسبب لم يقم بستجيل الدخول منذ فترة " },
    { value: 5, label: "مفعل ولم يقم بتغيير كلمة المرور منذ فترة" },
    { value: 6, label: "معطل لاسباب ادارية" },
] as SelectList[];

