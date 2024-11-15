import { usePathname } from "next/navigation";
import { Box, List, Theme, useMediaQuery } from '@mui/material';
import { useSelector } from '@/store/hooks';
import NavItem from '../NavItem/NavItem';
import NavCollapse from '../NavCollapse/NavCollapse';
import { AppState } from '@/store/store';
import { useNavigation } from '@/hooks/useNavigation';

const NavListing = () => {
   const pathname = usePathname();
   const pathDirect = pathname;
   const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf('/'));
   const customizer = useSelector((state: AppState) => state.customizer);
   const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
   const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
   const { menuItems, isLoading } = useNavigation();

   return (
      <Box>
         <List sx={{ p: 0, display: 'flex', gap: '3px', zIndex: '100' }}>
            {menuItems.map((item) => {
               if (item.children) {
                  return (
                     <NavCollapse
                        menu={item}
                        pathDirect={pathDirect}
                        hideMenu={hideMenu}
                        pathWithoutLastPart={pathWithoutLastPart}
                        level={1}
                        key={item.id} onClick={undefined} />
                  );

                  // {/********If Sub No Menu**********/}
               } else {
                  return (
                     <NavItem item={item} key={item.id} pathDirect={pathDirect} hideMenu={hideMenu} onClick={undefined} />
                  );
               }
            })}
         </List>
      </Box>
   );
};
export default NavListing;
