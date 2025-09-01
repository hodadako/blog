import { Injectable } from '@nestjs/common';
import {CreatePostRequest} from "@schema/post";

@Injectable()
export class PostService {
  create(request: CreatePostRequest) {
    
  }
}
