import { DeleteOutlined } from '@mui/icons-material';
import {
   Button ,Image
} from 'antd';
import { PersonFaceImageDto } from '../../types/person.types';

interface RowData {
    img: PersonFaceImageDto,
    removeOldImage(imgId:number): void
}

function FaceProcessedImage({ img,removeOldImage }: RowData ) {


  

    return (
        <div  style={{position:'relative',display:'flex'} }>
            <Image
                src={`data:image/jpeg;base64,${img.faceProcessedImage}`}
                style={{
                    width: '100%',
                    height: 90,
                    objectFit: 'cover',
                    borderRadius: 6,
                    border: img.isPrimary
                        ? '2px solid #1677ff'
                        : '1px solid #d9d9d9',
                }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            />
            <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                style={{
                    position: 'static',
                    top: 10, left:20,
                    minWidth: 'auto',
                    padding: '0 4px',
                }}
                onClick={() => removeOldImage(img.faceImageId)}
            />
        </div>
    );
}

export default FaceProcessedImage;