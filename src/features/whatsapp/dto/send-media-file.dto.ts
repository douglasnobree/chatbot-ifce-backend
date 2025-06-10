import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  IsObject,
} from 'class-validator';

export class SendMediaFileDto {
  @IsString()
  number: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsString()
  @IsIn(['image', 'document', 'video', 'audio'])
  mediatype: string;

  @IsOptional()
  @IsString()
  @IsIn(['composing', 'recording'])
  presence?: string;

  @IsOptional()
  @IsNumber()
  delay?: number;

  @IsOptional()
  @IsNumber()
  quotedMessageId?: number;

  @IsOptional()
  @IsObject()
  externalAttributes?: any;
}
