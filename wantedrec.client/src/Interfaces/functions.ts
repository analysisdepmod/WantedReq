import { AddUser, ITransilation, IUsersCounters, OfficerInfoDto, SpiAttitudeDto, SpiAttitudeDtoview, SpiUnitDTO, SubMangeMinistrysDto, TargetDto, TargetsMangeMinistryDto, TransInitailValue, User, UsersCardData } from "./GeneralInterface";
import axios from ".././api";
import { FormInstance } from "antd/lib";
import { ChangeEvent } from "react";
import { AppDispatch } from "../../app/store";
import { createUpdateAsync } from "../../app/reducers/craudSlice";
import { message } from "antd";
import { setModal } from "../../app/reducers/modalSlice";
import { iconMap, titleMap } from "./varaibles";
import debounce from 'lodash.debounce';

//export const Translate = (e: ChangeEvent<HTMLInputElement>, form: FormInstance) => {

//    const itemEn = e.target.id.split('_')[1] + "En";
//    const Trans: ITransilation = { ...TransInitailValue, text: e.target.value }

//    axios.post('/Translation/translate', Trans)
//        .then(res => {
//            form.setFieldValue(itemEn, res.data)
//        })
//        .catch((e) => {
//            console.log(e);
//            axios.get(`/Translation/gettranslate?text=${Trans.text}&sl=${Trans.sl}&tl=${Trans.tl}`)
//                .then(res => {
                   
//                    form.setFieldValue(itemEn, res.data)
//                })
//                .catch(e => console.log(e))
//        })
//}
    


const debouncedTranslateToEn = debounce(async (text: string, targetField: string, form: FormInstance, originalField: string) => {
    const Trans: ITransilation = { ...TransInitailValue, text, sl: "ar", tl: "en" };

    try {
        const res = await axios.post('/Translation/translate', Trans);
        const currentValue = form.getFieldValue(originalField);
         
             
        if (currentValue === text) {
            form.setFieldsValue({ [targetField]: res.data });
        }
    } catch {
        try {
            const fallback = await axios.get(`/Translation/gettranslate?text=${Trans.text}&sl=${Trans.sl}&tl=${Trans.tl}`);
            const currentValue = form.getFieldValue(originalField);
            if (currentValue === text) {
                form.setFieldsValue({ [targetField]: fallback.data });
            }
        } catch (e) {
            console.error(e);
        }
    }
}, 600);
const debouncedTranslateToAr = debounce(async (text: string, targetField: string, form: FormInstance, originalField: string) => {
    const Trans: ITransilation = { ...TransInitailValue, text, sl: "en", tl: "ar" };

    try {
        const res = await axios.post('/Translation/translate', Trans);
        const currentValue = form.getFieldValue(originalField);
        if (currentValue === text) {
            form.setFieldsValue({ [targetField]: res.data });
        }
    } catch {
        try {
            const fallback = await axios.get(`/Translation/gettranslate?text=${Trans.text}&sl=${Trans.sl}&tl=${Trans.tl}`);
            const currentValue = form.getFieldValue(originalField);
            if (currentValue === text) {
                form.setFieldsValue({ [targetField]: fallback.data });
            }
        } catch (e) {
            console.error(e);
        }
    }
}, 600);

export const Translate = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, form: FormInstance) => {
    let field = e.target.id;
    let fieldEn = `${field}En`;
    if (field.includes("trigger")) {
        field = field.split('_')[1];
    }
    if (fieldEn.includes("trigger")) {
        fieldEn = fieldEn.split('_')[1];
    }
    const cleanedText = ProccessText(e.target.value);
    console.log(field, fieldEn);

    form.setFieldValue(field, cleanedText);
    debouncedTranslateToEn(cleanedText, fieldEn, form, field);
};

export const TranslateToAR = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, form: FormInstance) => {
    let field = e.target.id;
    let fieldAr = field.replace("En", "");

   
    if (field.includes("trigger")) {
        field = field.split('_')[1];
    }
    if (fieldAr.includes("trigger")) {
        fieldAr = fieldAr.split('_')[1];
    }
    const cleanedText = ProccessText(e.target.value);

    form.setFieldValue(field, cleanedText);
    debouncedTranslateToAr(cleanedText, fieldAr, form, field);
};

 
//export const TranslateToAR = (e: ChangeEvent<HTMLInputElement>,form :FormInstance) => {

//    const item = e.target.id.split('_')[1].replace("En", "");
//    const Trans: ITransilation = { ...TransInitailValue, sl: "en", tl: "ar", text: e.target.value }
//    axios.post('/Translation/translate', Trans)
//        .then(res => {

//            form.setFieldValue(item, res.data)
//        }).catch((e) => {
//            console.log(e);
//            axios.get(`/Translation/gettranslate?text=${Trans.text}&sl=${Trans.sl}&tl=${Trans.tl}`)
//                .then(res => {
//                    form.setFieldValue(item, res.data)
//                })
//                .catch(e => console.log(e))
//        })
//}
 


//export const TranslateTextArea = (e: ChangeEvent<HTMLTextAreaElement>, form: FormInstance) => {
  
//    const itemEn = e.target.id.split('_')[1] + "En";
//    const cleanedText = ProccessText(e.target.value);
//   form.setFieldValue(e.target.id.split('_')[1], cleanedText)
//    const Trans: ITransilation = { ...TransInitailValue, text: e.target.value }

//    axios.post('/Translation/translate', Trans)
//        .then(res => {
//            form.setFieldValue(itemEn, res.data)
//        }).catch(() => {
           
//            axios.get(`/Translation/gettranslate?text=${Trans.text}&sl=${Trans.sl}&tl=${Trans.tl}`)
//                .then(res => {
//                    form.setFieldValue(itemEn, res.data)
//                })
//                .catch(e => console.log(e))
//        })
//}


 
//export const TranslateToARTextArea = (e: ChangeEvent<HTMLTextAreaElement>, form: FormInstance) => {
    
//    const item = e.target.id.split('_')[1].replace("En", "");
//    const cleanedText = ProccessText(e.target.value)

//    form.setFieldValue(e.target.id.split('_')[1], cleanedText);
//    const Trans: ITransilation = { ...TransInitailValue, sl: "en", tl: "ar", text: cleanedText }
//    axios.post('/Translation/translate', Trans)
//        .then(res => {

//            form.setFieldValue(item, res.data)
//        }).catch(() => {
          
//            axios.get(`/Translation/gettranslate?text=${Trans.text}&sl=${Trans.sl}&tl=${Trans.tl}`)
//                .then(res => {
//                    form.setFieldValue(item, res.data)
//                })
//                .catch(e => console.log(e))
//        })
//}

const ProccessText = (text: string): string => {
    //if (ar)
    //    text = text.replace(/[^0-9\u0600-\u06FF.,\n ]/g, '')
    //        .replace(/ {2,}/g, ' ')
    //        .replace(/\n{2,}/g, '\n')
    //        .replace(/,{2,}/g, ',');
    //else
    //    text = text.replace(/[^a-zA-Z0-9.,\n ]/g, '')
    //        .replace(/ {2,}/g, ' ')
    //        .replace(/\n{2,}/g, '\n')
    //        .replace(/,{2,}/g, ',');

    text = text.replace(/[^a-zA-Z0-9\u0600-\u06FF.,()\/+\-\n ]/g, '')
        .replace(/ {2,}/g, ' ')
        .replace(/\n{2,}/g, '\n')
        .replace(/,{2,}/g, ',');

    return text
        .split('\n')
        .map(line => {
            const dotCount = (line.match(/\./g) || []).length;
            if (dotCount > 1) {
                let seen = false;
                line = line.replace(/\./g, () => {
                    if (!seen) {
                        seen = true;
                        return '.';
                    }
                    return '';
                });
            }
            return line;
        })
        .join('\n');
};

export const DataIndexValue = (arlang:boolean,ColName: string, Obj:any) => {

    return Obj[(arlang ? ColName : ColName + "En")];
}
export const DataIndex = (arlang:boolean,ColName: string) => {

    return arlang ? ColName : ColName + "En";
}



export const TranslateWordToEn = async (text:string) => {

    
    const Trans: ITransilation = { ...TransInitailValue, text: text }

  const data=await  axios.post('/Translation/translate', Trans)
        .then(res => {
           
             return res.data
        });

    return Promise.resolve(data);
}
export const TranslateWordToAr =async (text: string) => {


    const Trans: ITransilation = { ...TransInitailValue, sl: "en", tl: "ar", text: text}

   const data= await axios.post('/Translation/translate', Trans)
        .then(res => {
            return res.data
        });

    return Promise.resolve( data);

}

type OnFinishResult = {
    success: boolean;
    error?: any;
};
type AllowedDto = AddUser | OfficerInfoDto | SpiAttitudeDtoview | SpiAttitudeDto | TargetDto | SpiUnitDTO | SubMangeMinistrysDto | TargetsMangeMinistryDto;

export const onFinish = async <T extends AllowedDto>(
    dispatch: AppDispatch,
    value: T,
    url: string,
    setLoading?: (loading: boolean) => void
): Promise<OnFinishResult> => {
    setLoading?.(true);

    try {
        const resultAction = await dispatch(
            createUpdateAsync({ url, formdata: value })
        );

        if (createUpdateAsync.fulfilled.match(resultAction)) {
            message.success('تم الحفظ'); 
            dispatch(setModal(true));
            return { success: true };
        } else {
            message.error('حدث خطأ');
            console.error('Error:', resultAction);
            return { success: false, error: resultAction };
        }
    } catch (error) {
        message.error('حدث خطأ غير متوقع');
        console.error('Unexpected error:', error);
        return { success: false, error };
    } finally {
        setLoading?.(false);
    }
};

export const CTAN = (text: string | null | number): string => {
    if (!text?.toString())
        return "";
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return text.toString().replace(/[0-9]/g, (digit) => arabicNumbers[parseInt(digit)]);
};


export const mapApiToCards = (counters: IUsersCounters[]): UsersCardData[] => {
    const normalCards = counters
        .filter((c) => !c.isSummary)
        .map((c) => ({
            id: c.id,
            title: titleMap[c.id],
            icon: iconMap[c.id],
            count: c.counter,
        }));

    const summaryCard: UsersCardData = {
        id: 100,
        title: "معلومات عامة",
        isSummary: true,
        data: counters
            .filter((c) => c.isSummary)
            .map((c) => ({
                label: titleMap[c.id],
                value: c.counter,
                icon: iconMap[c.id],
            })),
    };

    return [...normalCards, summaryCard];
};

export const mapUserToAddUser = (user: User): AddUser => ({
    id: user.id,
    email: user.email.split('@')[0].toString(),
    personNo: user.personNo,
    personName: user.personName,
    personPosition: user.personPosition,
    cisco: user.cisco,
    roleWithUserDto: user.roleWithUserDto ?? [],
    ur_no: user.ur_no,
    rankId: user.rankId,
    hrTest: user.hrTest,
    originalUintUser: user.originalUintUser,
    createLevel: user.createLevel,
    unitUser: user.unitUser
     
});


export const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () =>
            resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export const base64ToFile = (base64: string, fileName: string, mimeType: string = 'image/jpeg'): File => {
    const byteCharacters = atob(base64);
    const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
};

export const ValidFile = (file: File, allowedTypes: string[] = ["image/jpeg", "image/png"], maxSize: number = 5 * 1024 * 1024) => {

    if (!file) {
        console.log("ما اختار فايل");
        return false;
    }

    // تحقق إذا الفايل فارغ
    if (file.size === 0) {
        console.log("الفايل فارغ");
        return false;
    }

    // تحقق من النوع (مثلاً PDF أو صورة)
    //const allowedTypes = [ "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
        console.log("نوع الفايل مو صالح");
        return false;
    }

    // تحقق من الحجم الأقصى (مثلاً 5MB)
    //const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        console.log("الفايل أكبر من المسموح");
        return false;
    }
}