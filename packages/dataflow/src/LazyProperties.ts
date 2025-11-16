export class LazyProperties {
    private static properties = new WeakMap<object, Map<PropertyKey, PropertyDescriptor>>();

    private static getPropertyDescriptor(o: any, p: PropertyKey): PropertyDescriptor | undefined {
        return LazyProperties.properties.get(o)?.get(p);
    }

    private static savePropertyDescriptor(o: any, p: PropertyKey, pd: PropertyDescriptor): void {
        const map = LazyProperties.properties.get(o) || new Map<PropertyKey, PropertyDescriptor>();
        map.set(p, pd);
        LazyProperties.properties.set(o, map);
    }

    static defineProperty<T>(o: T, p: PropertyKey, attributes: PropertyDescriptor): T {
        LazyProperties.savePropertyDescriptor(o, p, attributes);
        return Object.defineProperty(o, p, {
            ...attributes,
            get: function () {
                const value = attributes.get!();
                const newAttributes = {...attributes, value, writable: false};
                delete newAttributes.get;
                Object.defineProperty(o, p, newAttributes);
                return value;
            },
        })
    }

    static resetProperty<T>(o: T, p: PropertyKey): void {
        const propertyDescriptor = LazyProperties.getPropertyDescriptor(o, p);
        if (propertyDescriptor) Object.defineProperty(o, p, propertyDescriptor);
    }
}