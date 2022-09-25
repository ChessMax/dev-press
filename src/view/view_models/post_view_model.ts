import {Post} from "../../post/post";
import {LayoutViewModel} from "./layout_view_model";

export interface PostViewModel extends LayoutViewModel {
    post: Post;
}
