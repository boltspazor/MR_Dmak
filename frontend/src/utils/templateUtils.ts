import { Template } from '../types/index';

interface Parameter {
  name: string;
  type: 'text' | 'number';
}

export const extractParameters = (template: Template): Parameter[] => {
  if (template.parameters && template.parameters.length > 0) {
    return template.parameters.map(param =>
      typeof param === 'string'
        ? { name: param, type: 'text' as const }
        : { name: param.name, type: param.type || 'text' as const }
    );
  }

  const paramRegex = /\{\{([A-Za-z0-9_]+)\}\}/g;
  const matches = template.content.match(paramRegex);
  if (!matches) return [];

  const uniqueParams = [...new Set(matches.map(match => match.replace(/\{\{|\}\}/g, '')))];

  const numericPatterns = [
    'target', 'achievement', 'count', 'number', 'amount', 'price', 'value',
    'score', 'rate', 'percentage', 'total', 'sum', 'quantity', 'qty',
    'year', 'month', 'day', 'hour', 'minute', 'second', 'time',
    'age', 'weight', 'height', 'distance', 'length', 'width', 'depth'
  ];

  const textPatterns = [
    'name', 'firstname', 'lastname', 'fn', 'ln', 'title', 'company',
    'location', 'city', 'state', 'country', 'address', 'email',
    'product', 'productname', 'category', 'type', 'status', 'group',
    'doctor', 'patient', 'customer', 'client', 'user', 'person'
  ];

  return uniqueParams.map(param => {
    const lowerParam = param.toLowerCase();

    if (numericPatterns.some(pattern => lowerParam.includes(pattern))) {
      return { name: param, type: 'number' as const };
    }

    if (textPatterns.some(pattern => lowerParam.includes(pattern))) {
      return { name: param, type: 'text' as const };
    }

    return { name: param, type: 'text' as const };
  });
};

export const processContent = (content: string): string => {
  return content || '';
};
