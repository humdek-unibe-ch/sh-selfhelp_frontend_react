"use client";
import { notFound } from 'next/navigation';
import PageContainer from "@/app/components/container/PageContainer";
import { useNavigation } from "@/hooks/useNavigation";
import { usePageContent } from "@/hooks/usePageConent";
import BasicStyle from "@/app/components/styles/BasicStyle";
import Breadcrumb from "../layout/shared/breadcrumb/Breadcrumb";
import { useEffect } from 'react';
import { PageService } from '@/services/page.service';

export default function DynamicPage({ params }: { params: { slug: string } }) {
    const { routes, isLoading: routesLoading } = useNavigation();    

    const isValid = routes?.some(route => route.path === `/${params.slug}`);
    const { content: pageContent, isLoading: pageLoading } = usePageContent(params.slug, isValid);

    const breadcrumbItems = [
        {
            title: "Home",
            to: "/"
        },
        {
            title: pageContent?.title || params.slug.charAt(0).toUpperCase() + params.slug.slice(1)
        }
    ];

    useEffect(() => {
        PageService.setKeyword(params.slug);
    }, [params.slug]);

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