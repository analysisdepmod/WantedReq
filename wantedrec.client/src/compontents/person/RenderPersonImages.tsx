import {
    Form, Input, Select, DatePicker, Switch,
    Upload, Button, Card, Row, Col,
    Typography, Space, Image, message,
    Spin, Alert, Divider,
    Tag,
} from 'antd';
import FaceProcessedImage from './FaceProcessedImage';
import { CameraOutlined } from '@mui/icons-material';
import { Key, useState } from 'react';
import { PersonFaceImageDto } from '../../types/person.types';

interface PersonImages{
    faceImages: PersonFaceImageDto[],
    removeOldImage(imgId: number): void
}
function RenderPersonImages({ faceImages, removeOldImage }: PersonImages) {


  return (
      <Row gutter={[8, 8]} style={{ marginTop: 8, marginBottom: 16 }}>

          {faceImages.map((img: PersonFaceImageDto) => (

              <Col key={img.faceImageId} span={12}>
                  <div style={{ position: 'relative' }}>
                  {img.imageFilePath ? (
                          <FaceProcessedImage img={img} removeOldImage={removeOldImage} />

                  ) : (
                      <div style={{
                          width: '100%', height: 90,
                          background: '#f5f5f5',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                      }}>
                          <CameraOutlined style={{ color: '#bbb' }} />
                      </div>
                  )}
                  {img.isPrimary && (
                      <Tag
                          color="blue"
                          style={{
                              position: 'absolute',
                              top: 4, right: 4,
                              fontSize: 10,
                          }}
                      >
                          رئيسية
                      </Tag>
                  )}
                  {/*{img.generatedByAi && (*/}
                  {/*    <Tag*/}
                  {/*        color="purple"*/}
                  {/*        style={{*/}
                  {/*            position: 'absolute',*/}
                  {/*            bottom: 4, right: 4,*/}
                  {/*            fontSize: 10,*/}
                  {/*        }}*/}
                  {/*    >*/}
                  {/*        AI*/}
                  {/*    </Tag>*/}
                  {/*    )}*/}
                  </div>
              </Col>
          ))}
      </Row>
  );
}

export default RenderPersonImages;