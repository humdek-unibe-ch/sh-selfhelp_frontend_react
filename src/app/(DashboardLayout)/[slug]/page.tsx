"use client";
import { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import { notFound } from 'next/navigation';
import PageContainer from "@/app/components/container/PageContainer";
import DashboardCard from "@/app/components/shared/DashboardCard";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import { useNavigation } from "@/hooks/useNavigation";

interface PageData {
   title: string;
   content: string;
}

export default function DynamicPage({ params }: { params: { slug: string } }) {
   const [pageData, setPageData] = useState<PageData | null>(null);

   const { routes: routes, isLoading: routesLoading } = useNavigation();

   const isValid = routes?.some(route => route.path === `/${params.slug}`);

   useEffect(() => {
      async function loadPageData() {         
         const mockData = {
            title: params.slug.charAt(0).toUpperCase() + params.slug.slice(1),
            content: `This is the dynamic content for ${params.slug} page`
         };

         setPageData(mockData);
      }
      loadPageData();
   }, [params.slug]);

   if (routesLoading) {
      return <div>Loading...</div>;
   }

   if (!routesLoading && !isValid) {
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