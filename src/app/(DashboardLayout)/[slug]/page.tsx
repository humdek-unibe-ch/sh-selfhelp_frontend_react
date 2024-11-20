"use client";
import { useEffect } from "react";
import { notFound } from 'next/navigation';
import PageContainer from "@/app/components/container/PageContainer";
import { useNavigation } from "@/hooks/useNavigation";
import { usePageContent } from "@/hooks/usePageConent";
import BasicStyle from "@/app/components/styles/BasicStyle";
import Breadcrumb from "../layout/shared/breadcrumb/Breadcrumb";

export default function DynamicPage({ params }: { params: { slug: string } }) {
    const { routes, isLoading: routesLoading } = useNavigation();
    const { content: pageContent, isLoading: pageLoading } = usePageContent(params.slug);

    const isValid = routes?.some(route => route.path === `/${params.slug}`);

    const breadcrumbItems = [
        {
            title: "Home",
            to: "/"
        },
        {
            title: pageContent?.title || params.slug.charAt(0).toUpperCase() + params.slug.slice(1)
        }
    ];

    if (routesLoading || pageLoading) {
        return (
            <PageContainer>
                <div>Loading...</div>
            </PageContainer>
        );
    }

    if (!isValid) {
        notFound();
    }

    const pageTitle = pageContent?.title || params.slug.charAt(0).toUpperCase() + params.slug.slice(1);

    return (
        <PageContainer title={pageTitle} description={pageContent?.description}>
            <Breadcrumb 
                title={pageTitle}
                items={breadcrumbItems}
                subtitle={pageContent?.description}
            />
            <div>
                {pageContent?.content?.map((style, index) => (
                    style ? <BasicStyle key={`style-${index}`} style={style} /> : null
                ))}
            </div>
        </PageContainer>
    );
}