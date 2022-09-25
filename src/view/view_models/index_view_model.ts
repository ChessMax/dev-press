import {LayoutViewModel} from "./layout_view_model";
import {Post} from "../../post/post";

export interface IndexViewModel extends LayoutViewModel {
    posts: Post[];
}
