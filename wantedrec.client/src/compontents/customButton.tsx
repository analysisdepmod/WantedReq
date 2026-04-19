import { Button } from "antd";
 
import { useTranslation } from "react-i18next";


 
interface  Iflag {
    flag: number,
    btnLoading: boolean
};
const CustomButton = ({ flag, btnLoading }: Iflag) => {
   
    const { t } = useTranslation();
    return (
        
          flag == 1 ? 
            <Button htmlType="submit"
                className="btn btn-md btn-success w-50 text-light"
                loading={btnLoading}
                disabled={btnLoading}
            >   {`${t("save")}`}</Button>
            : flag == 2 ? 
                <Button htmlType="submit"
                    className="btn btn-md btn-primary w-50 text-light"
                    loading={btnLoading}
                    disabled={btnLoading}
                >    {`${t("edit")}`} </Button>
                : flag == 3 ?
                    <Button
                        className="btn btn-md btn-danger w-50 text-light "
                        loading={btnLoading}
                        disabled={btnLoading}

                    >   {`${t("delete")}`}</Button>
                    : null
            
    )
}
export default CustomButton;