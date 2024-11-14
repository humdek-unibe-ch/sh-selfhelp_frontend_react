"use client";
import { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import { notFound, usePathname } from 'next/navigation';
import { useSelector } from '@/store/hooks';
import { RootState } from '@/store/store';
import PageContainer from "@/app/components/container/PageContainer";
import DashboardCard from "@/app/components/shared/DashboardCard";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import { isValidRoute } from "@/store/routes/RouteSlice";

interface PageData {
   title: string;
   content: string;
}

export default function DynamicPage({ params }: { params: { slug: string } }) {
   const [pageData, setPageData] = useState<PageData | null>(null);
   const [isLoading, setLoading] = useState(true);

   const routes = useSelector((state: RootState) => state.routes.availableRoutes);
   const routesLoading = useSelector((state: RootState) => state.routes.isLoading);
   const { slug } = params;
   const isValid = useSelector((state: RootState) => isValidRoute(state, `/${slug}`));

   useEffect(() => {
      console.log('Loading page data for:', params.slug);
      async function loadPageData() {         
         const mockData = {
            title: params.slug.charAt(0).toUpperCase() + params.slug.slice(1),
            content: `This is the dynamic content for ${params.slug} page`
         };

         setPageData(mockData);
         setLoading(false);
      }
      loadPageData();
   }, [params.slug]);

   if (routesLoading) {
      return <div>Loading...</div>;
   }

   if (!routesLoading && !isValid) {
      console.log('Routes:', routes); // Debug log
      console.log('Checking path:', `/${params.slug}`); // Debug log
      notFound();
   }

   const BCrumb = [
      {
         to: "/",
         title: "Dashboard",
      },
      {
         title: pageData?.title || params.slug,
      },
   ];

   return (
      <PageContainer title={pageData?.title || ""} description={`This is ${params.slug} page`}>
         <Breadcrumb title={pageData?.title || ""} items={BCrumb} />
         <DashboardCard title={pageData?.title || ""}>
            <Typography>{pageData?.content}</Typography>
         </DashboardCard>
      </PageContainer>
   );
}