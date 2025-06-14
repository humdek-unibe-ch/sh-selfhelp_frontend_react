export interface IMenuitemsType {
   id?: string;
   navlabel?: boolean;
   subheader?: string;
   title?: string;
   icon?: any;
   href?: string;
   children?: IMenuitemsType[];
   chip?: string;
   chipColor?: string;
   variant?: string;
   external?: boolean;
 }
