 
import { useSelector } from "react-redux";
import { useState } from "react";
import { InputNumber } from 'antd/lib';
import { Button, message } from 'antd';
import { useDispatch } from 'react-redux';
import { changecharector } from '../../app/reducers/settingSlice';
import { AppDispatch, RootState } from "../../app/store";


const Settings = ({ }: {row?:any,flag?:any}) => {
    const dispatch = useDispatch<AppDispatch>();
    const currentCharector = useSelector((state: RootState) => state.setting.charector);
    const [inputValue, setInputValue] = useState<number>(currentCharector);

    const handleSave = () => {
        dispatch(changecharector(inputValue));
        message.success('تم الحفظ بنجاح');
    };
  
    return ( 
        <>
        <div style={{ marginBottom: '20px' }}>
                <label style={{ marginRight: '10px' }}>عدد الكلمات:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <InputNumber
                min={0}
                value={inputValue}
                onChange={(value) => setInputValue(value ?? 0)}
                style={{ width: 250, marginRight: '10px' }}
            />
            <Button type="primary" onClick={handleSave}>
                حفظ
                    </Button>
            </div>
            <p style={{ marginTop: '10px' }}>القيمة الحالية من عدد الكلمات: {currentCharector}</p>
            </div>
        </>
    ) 
 
}
export default Settings;