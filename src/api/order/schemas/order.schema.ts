import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Record', required: true })
  recordId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  // Price snapshot at purchase time (to remain correct if record price changes later).
  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
