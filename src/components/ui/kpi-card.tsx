import React from 'react';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';

export interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}

export function KPICard({ title, value, subtitle, icon: Icon }: KPICardProps) {
  return (
    <Card className="border border-border/50 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardDescription className="text-xs font-medium text-muted-foreground">
          {title}
        </CardDescription>
        <Icon className="h-4 w-4 text-muted-foreground/60" />
      </CardHeader>
      <CardContent>
        <CardTitle className="text-2xl font-bold mb-1">
          {value}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}