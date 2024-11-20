export type Style = IContainerStyle | IImageStyle | IMarkdownStyle | IHeadingStyle | ICardStyle | IDivStyle | IButtonStyle | ICarouselStyle | ILinkStyle | IBaseStyle;

interface IBaseStyle {
    id: IIdType;
    css: string;
    style_name: string;
    condition?: IContentField<any> | null;
    debug?: IContentField<string>;
    data_config?: IContentField<any>;
    css_mobile?: IContentField<string>;
}

export interface IContainerStyle extends IBaseStyle {
    style_name: 'container';
    children: Style[];
    is_fluid?: IContentField<string>;
    export_pdf?: IContentField<string>;
}

export interface IImageStyle extends IBaseStyle {
    style_name: 'image';
    title?: IContentField<string>;
    is_fluid?: IContentField<string>;
    alt?: IContentField<string>;
    img_src: IContentField<string>;
    height?: IContentField<string>;
    width?: IContentField<string>;
    source?: {
        content: string;
    };
}

export interface IMarkdownStyle extends IBaseStyle {
    style_name: 'markdown';
    text_md: IContentField<string>;
    formula?: IContentField<string>;
}

export interface IHeadingStyle extends IBaseStyle {
    style_name: 'heading';
    level: IContentField<string>;
    title: IContentField<string>;
}

export interface ICardStyle extends IBaseStyle {
    style_name: 'card';
    children: Style[];
    title: IContentField<string>;
    type?: IContentField<string>;
    is_expanded?: IContentField<string>;
    is_collapsible?: IContentField<string>;
    url_edit?: IContentField<string>;
}

export interface IDivStyle extends IBaseStyle {
    style_name: 'div';
    children: Style[];
    color_background?: IContentField<string>;
    color_border?: IContentField<string>;
    color_text?: IContentField<string>;
    custom_style?: {
        content: string;
    };
}

export interface IIdType {
    content: number;
    type: string;
}

export interface IContentField<T> {
    content: T;
    meta?: string;
    type?: string;
    id?: string;
    default?: string;
}

export interface IButtonStyle extends IBaseStyle {
    style_name: 'button';
    label: IContentField<string>;
    url?: IContentField<string>;
    type?: IContentField<string>;
    label_cancel?: IContentField<string>;
    confirmation_title?: IContentField<string>;
    confirmation_continue?: IContentField<string>;
    confirmation_message?: IContentField<string>;
}

interface ICarouselSource {
    source: string;
    alt?: string;
    caption?: string;
}

export interface ICarouselStyle extends IBaseStyle {
    style_name: 'carousel';
    sources: IContentField<ICarouselSource[]>;
    id_prefix?: IContentField<string>;
    has_controls?: IContentField<string>;
    has_indicators?: IContentField<string>;
    has_crossfade?: IContentField<string>;
}

export interface ILinkStyle extends IBaseStyle {
    style_name: 'link';
    label: IContentField<string>;
    url: IContentField<string>;
    open_in_new_tab?: IContentField<string>;
}